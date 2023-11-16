# Python imports
import zoneinfo
import json

# Django imports
from django.urls import resolve
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.serializers.json import DjangoJSONEncoder

# Third part imports
from rest_framework import status
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from sentry_sdk import capture_exception
from django_filters.rest_framework import DjangoFilterBackend

# Module imports
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

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        if (
            self.webhook_event
            and self.request.method in ["POST", "PATCH", "DELETE"]
            and response.status_code in [200, 201, 204]
        ):
            send_webhook.delay(
                event=self.webhook_event,
                event_data=json.dumps(response.data, cls=DjangoJSONEncoder),
                action=self.request.method,
                slug=self.workspace_slug,
            )

        return response


class BaseViewSet(TimezoneMixin, ModelViewSet, BasePaginator):
    model = None

    permission_classes = [
        IsAuthenticated,
    ]

    filter_backends = (
        DjangoFilterBackend,
        SearchFilter,
    )

    filterset_fields = []

    search_fields = []

    def get_queryset(self):
        try:
            return self.model.objects.all()
        except Exception as e:
            capture_exception(e)
            raise APIException("Please check the view", status.HTTP_400_BAD_REQUEST)

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
                model_name = str(exc).split(" matching query does not exist.")[0]
                return Response(
                    {"error": f"{model_name} does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if isinstance(e, KeyError):
                capture_exception(e)
                return Response(
                    {"error": f"key {e} does not exist"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            print(e) if settings.DEBUG else print("Server Error")
            capture_exception(e)
            return Response({"error": "Something went wrong please try again later"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        project_id = self.kwargs.get("project_id", None)
        if project_id:
            return project_id

        if resolve(self.request.path_info).url_name == "project":
            return self.kwargs.get("pk", None)


class BaseAPIView(TimezoneMixin, APIView, BasePaginator):
    permission_classes = [
        IsAuthenticated,
    ]

    filter_backends = (
        DjangoFilterBackend,
        SearchFilter,
    )

    filterset_fields = []

    search_fields = []

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
                model_name = str(exc).split(" matching query does not exist.")[0]
                return Response(
                    {"error": f"{model_name} does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            
            if isinstance(e, KeyError):
                return Response({"error": f"key {e} does not exist"}, status=status.HTTP_400_BAD_REQUEST)

            if settings.DEBUG:
                print(e)
            capture_exception(e)
            return Response({"error": "Something went wrong please try again later"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)
