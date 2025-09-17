# Python imports
import zoneinfo

# Django imports
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import IntegrityError
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Third party imports
from rest_framework.views import APIView

# Module imports
from plane.ee.permissions import HMACPermission
from plane.ee.views.api.service_rate_limit import InternalServiceRateThrottle
from plane.utils.exception_logger import log_exception
from plane.utils.paginator import BasePaginator


class TimezoneMixin:
    """
    This enables timezone conversion according
    to the user set timezone
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user.is_authenticated:
            timezone.activate(zoneinfo.ZoneInfo(request.user.user_timezone))
        else:
            timezone.deactivate()


class BaseServiceAPIView(TimezoneMixin, APIView, BasePaginator):
    authentication_classes = []

    permission_classes = [HMACPermission]

    throttle_classes = [InternalServiceRateThrottle]

    def filter_queryset(self, queryset):
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def handle_exception(self, exc):
        """
        Handle any exception that occurs, by returning an appropriate response,
        or re-raising the error.
        """
        try:
            response = super().handle_exception(exc)
            return response
        except Exception as e:
            if isinstance(e, IntegrityError):
                return Response(
                    {"error": "The payload is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ValidationError):
                return Response(
                    {"error": "Please provide valid detail"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ObjectDoesNotExist):
                return Response(
                    {"error": "The requested resource does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if isinstance(e, KeyError):
                return Response(
                    {"error": "The required key does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def dispatch(self, request, *args, **kwargs):
        try:
            response = super().dispatch(request, *args, **kwargs)
            if settings.DEBUG:
                from django.db import connection

                print(
                    f"{request.method} - {request.get_full_path()} of Queries: {len(connection.queries)}"
                )
            return response
        except Exception as exc:
            response = self.handle_exception(exc)
            return exc

    def finalize_response(self, request, response, *args, **kwargs):
        # Call super to get the default response
        response = super().finalize_response(request, response, *args, **kwargs)

        # Add custom headers if they exist in the request META
        ratelimit_remaining = request.META.get("X-RateLimit-Remaining")
        if ratelimit_remaining is not None:
            response["X-RateLimit-Remaining"] = ratelimit_remaining

        ratelimit_reset = request.META.get("X-RateLimit-Reset")
        if ratelimit_reset is not None:
            response["X-RateLimit-Reset"] = ratelimit_reset

        ratelimit_limit = request.META.get("X-RateLimit-Limit")
        if ratelimit_limit is not None:
            response["X-RateLimit-Limit"] = ratelimit_limit

        return response
