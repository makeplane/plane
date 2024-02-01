# Python imports
import zoneinfo
import json

# Django imports
from django.conf import settings
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.utils import timezone

# Third party imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.api.rate_limit import ApiKeyRateThrottle
from plane.utils.paginator import BasePaginator
from plane.bgtasks.webhook_task import send_webhook


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


class WebhookMixin:
    webhook_event = None
    bulk = False

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(
            request, response, *args, **kwargs
        )

        # Check for the case should webhook be sent
        if (
            self.webhook_event
            and self.request.method in ["POST", "PATCH", "DELETE"]
            and response.status_code in [200, 201, 204]
        ):
            # Push the object to delay
            send_webhook.delay(
                event=self.webhook_event,
                payload=response.data,
                kw=self.kwargs,
                action=self.request.method,
                slug=self.workspace_slug,
                bulk=self.bulk,
            )

        return response


class BaseAPIView(TimezoneMixin, APIView, BasePaginator):
    authentication_classes = [
        APIKeyAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    throttle_classes = [
        ApiKeyRateThrottle,
    ]

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
                    {
                        "error": "The provided payload is not valid please try with a valid payload"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ObjectDoesNotExist):
                return Response(
                    {"error": f"The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if isinstance(e, KeyError):
                return Response(
                    {"error": f" The required key does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if settings.DEBUG:
                print(e)
            capture_exception(e)
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
        response = super().finalize_response(
            request, response, *args, **kwargs
        )

        # Add custom headers if they exist in the request META
        ratelimit_remaining = request.META.get("X-RateLimit-Remaining")
        if ratelimit_remaining is not None:
            response["X-RateLimit-Remaining"] = ratelimit_remaining

        ratelimit_reset = request.META.get("X-RateLimit-Reset")
        if ratelimit_reset is not None:
            response["X-RateLimit-Reset"] = ratelimit_reset

        return response

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def fields(self):
        fields = [
            field
            for field in self.request.GET.get("fields", "").split(",")
            if field
        ]
        return fields if fields else None

    @property
    def expand(self):
        expand = [
            expand
            for expand in self.request.GET.get("expand", "").split(",")
            if expand
        ]
        return expand if expand else None
