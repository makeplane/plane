# Python imports
import zoneinfo

# Django imports
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import IntegrityError
from django.urls import resolve
from django.utils import timezone
from plane.db.models.api import APIToken
from plane.db.models import Project, User
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Third party imports
from rest_framework.views import APIView

# Module imports
from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.api.rate_limit import ApiKeyRateThrottle, ServiceTokenRateThrottle
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


class BaseAPIView(TimezoneMixin, APIView, BasePaginator):
    authentication_classes = [
        APIKeyAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    def filter_queryset(self, queryset):
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get_throttles(self):
        throttle_classes = []
        api_key = self.request.headers.get("X-Api-Key")

        if api_key:
            service_token = APIToken.objects.filter(
                token=api_key,
                is_service=True,
            ).first()

            if service_token:
                throttle_classes.append(ServiceTokenRateThrottle())
                return throttle_classes

        throttle_classes.append(ApiKeyRateThrottle())

        return throttle_classes

    def handle_exception(self, exc):
        """
        Handle any exception that occurs, by returning an appropriate response,
        or re-raising the error.
        """
        try:
            print(exc)
            response = super().handle_exception(exc)
            return response
        except Exception as e:
            if isinstance(e, IntegrityError):
                return Response(
                    {"error": "The payload is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ValidationError):
                import traceback; traceback.print_exc()
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
            kwargs = self.check_kwargs(kwargs)
            request.user = self.get_or_create_user_from_headers(request)
            self.ensure_member_in_workspace(request.user, kwargs)
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

    def check_kwargs(self, kwargs):
        from plane.authentication.views.app.magic import MagicSignInEndpoint
        admin_user = User.objects.filter(is_superuser=True).first()
        if kwargs.get('slug', None):
            MagicSignInEndpoint().add_user_to_workspace(admin_user, kwargs['slug'])
            project_id = self.kwargs.get("project_id", None)
            if project_id == "DEFAULT":
                project = Project.objects.filter(
                        name='TICKET', workspace__slug=kwargs['slug']
                    ).first()
                if project:
                    kwargs['project_id'] = project.id

        
        return kwargs

    def get_or_create_user_from_headers(self, request):
        """Extracts user info from headers and ensures they exist in the database."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        assume_role = request.headers.get("X-Assume-Role")

        if assume_role:
            user, created = User.objects.get_or_create(
                username=assume_role,  
                defaults={"email": f"{assume_role}@example.com"}
            )

            if created:
                print(f"New user created: {assume_role}")

            return user

        return request.user  # Default user if no assume role is found


    def ensure_member_in_workspace(self, user, kwargs):
        """ Ensures the given user is a member of the workspace. """
        from plane.authentication.views.app.magic import MagicSignInEndpoint

        if not user or not user.is_authenticated:  
            return  
        
        if kwargs.get('slug', None):
            MagicSignInEndpoint().add_user_to_workspace(user, kwargs['slug'])

        
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
        project_id = self.kwargs.get("project_id", None)
        # if project_id == "DEFAULT":
        #     import pdb;pdb.set_trace
        #     return self.workspace.workspace_project.filter(name='default').first().id
        if project_id:
            return project_id

        if resolve(self.request.path_info).url_name == "project":
            return self.kwargs.get("pk", None)

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