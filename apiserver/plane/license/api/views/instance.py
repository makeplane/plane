# Python imports
import os
import uuid
from urllib.parse import urlencode

# Django imports
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView
from plane.authentication.utils.login import user_login
from plane.db.models import Profile, User
from plane.license.api.permissions import (
    InstanceAdminPermission,
)
from plane.license.api.serializers import (
    InstanceAdminSerializer,
    InstanceConfigurationSerializer,
    InstanceSerializer,
)
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.license.utils.encryption import encrypt_data
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.cache import cache_response, invalidate_cache


class InstanceEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [
                InstanceAdminPermission(),
            ]
        return [
            AllowAny(),
        ]

    @cache_response(60 * 60 * 2, user=False)
    def get(self, request):
        instance = Instance.objects.first()
        # get the instance
        if instance is None:
            return Response(
                {"is_activated": False, "is_setup_done": False},
                status=status.HTTP_200_OK,
            )
        # Return instance
        serializer = InstanceSerializer(instance)
        data = serializer.data
        data["is_activated"] = True
        # Get all the configuration
        (
            GOOGLE_CLIENT_ID,
            GITHUB_CLIENT_ID,
            GITHUB_APP_NAME,
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            ENABLE_MAGIC_LINK_LOGIN,
            ENABLE_EMAIL_PASSWORD,
            SLACK_CLIENT_ID,
            POSTHOG_API_KEY,
            POSTHOG_HOST,
            UNSPLASH_ACCESS_KEY,
            OPENAI_API_KEY,
        ) = get_configuration_value(
            [
                {
                    "key": "GOOGLE_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_CLIENT_ID", ""),
                },
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID", ""),
                },
                {
                    "key": "GITHUB_APP_NAME",
                    "default": os.environ.get("GITHUB_APP_NAME", ""),
                },
                {
                    "key": "EMAIL_HOST",
                    "default": os.environ.get("EMAIL_HOST", ""),
                },
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", ""),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", ""),
                },
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "1"),
                },
                {
                    "key": "ENABLE_EMAIL_PASSWORD",
                    "default": os.environ.get("ENABLE_EMAIL_PASSWORD", "1"),
                },
                {
                    "key": "SLACK_CLIENT_ID",
                    "default": os.environ.get("SLACK_CLIENT_ID", None),
                },
                {
                    "key": "POSTHOG_API_KEY",
                    "default": os.environ.get("POSTHOG_API_KEY", None),
                },
                {
                    "key": "POSTHOG_HOST",
                    "default": os.environ.get("POSTHOG_HOST", None),
                },
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY", ""),
                },
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", ""),
                },
            ]
        )

        data = {}
        # Authentication

        data["is_google_enabled"] = bool(
            (
                GOOGLE_CLIENT_ID
                if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != '""'
                else None
            )
        )
        data["is_github_enabled"] = bool(
            GITHUB_CLIENT_ID
            if GITHUB_CLIENT_ID and GITHUB_CLIENT_ID != '""'
            else None
        )
        data["github_app_name"] = str(GITHUB_APP_NAME)

        # Slack client
        data["slack_client_id"] = SLACK_CLIENT_ID

        # Posthog
        data["posthog_api_key"] = POSTHOG_API_KEY
        data["posthog_host"] = POSTHOG_HOST

        # Unsplash
        data["has_unsplash_configured"] = bool(UNSPLASH_ACCESS_KEY)

        # Open AI settings
        data["has_openai_configured"] = bool(OPENAI_API_KEY)

        # File size settings
        data["file_size_limit"] = float(
            os.environ.get("FILE_SIZE_LIMIT", 5242880)
        )

        # is smtp configured
        data["is_smtp_configured"] = (
            bool(EMAIL_HOST)
            and bool(EMAIL_HOST_USER)
            and bool(EMAIL_HOST_PASSWORD)
        )

        response_data = {"config": data, "instance": serializer.data}
        return Response(response_data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/instances/", user=False)
    def patch(self, request):
        # Get the instance
        instance = Instance.objects.first()
        serializer = InstanceSerializer(
            instance, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceAdminEndpoint(BaseAPIView):
    permission_classes = [
        InstanceAdminPermission,
    ]

    @invalidate_cache(path="/api/instances/", user=False)
    # Create an instance admin
    def post(self, request):
        email = request.data.get("email", False)
        role = request.data.get("role", 20)

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not registered yet"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Fetch the user
        user = User.objects.get(email=email)

        instance_admin = InstanceAdmin.objects.create(
            instance=instance,
            user=user,
            role=role,
        )
        serializer = InstanceAdminSerializer(instance_admin)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @cache_response(60 * 60 * 2)
    def get(self, request):
        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not registered yet"},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance_admins = InstanceAdmin.objects.filter(instance=instance)
        serializer = InstanceAdminSerializer(instance_admins, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/instances/", user=False)
    def delete(self, request, pk):
        instance = Instance.objects.first()
        InstanceAdmin.objects.filter(instance=instance, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        InstanceAdminPermission,
    ]

    @cache_response(60 * 60 * 2, user=False)
    def get(self, request):
        instance_configurations = InstanceConfiguration.objects.all()
        serializer = InstanceConfigurationSerializer(
            instance_configurations, many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/configs/", user=False)
    def patch(self, request):
        configurations = InstanceConfiguration.objects.filter(
            key__in=request.data.keys()
        )

        bulk_configurations = []
        for configuration in configurations:
            value = request.data.get(configuration.key, configuration.value)
            if configuration.is_encrypted:
                configuration.value = encrypt_data(value)
            else:
                configuration.value = value
            bulk_configurations.append(configuration)

        InstanceConfiguration.objects.bulk_update(
            bulk_configurations, ["value"], batch_size=100
        )

        serializer = InstanceConfigurationSerializer(configurations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceAdminSignInEndpoint(View):
    permission_classes = [
        AllowAny,
    ]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check if the instance is already activated
        if InstanceAdmin.objects.first():
            url = (
                referer
                + "?"
                + urlencode(
                    {
                        "error": "Admin for the instance has been already registered"
                    }
                )
            )
            return HttpResponseRedirect(url)
        # Get the email and password from all the user
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)
        first_name = request.POST.get("first_name", False)
        last_name = request.POST.get("last_name", "")
        company_name = request.POST.get("company_name", "")
        is_telemetry_enabled = request.POST.get("is_telemetry_enabled", True)

        # return error if the email and password is not present
        if not email or not password or not first_name:
            url = (
                referer
                + "?"
                + urlencode({"error": "Email, name and password are required"})
            )
            return HttpResponseRedirect(url)

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            url = (
                referer
                + "?"
                + urlencode({"error": "Please provide a valid email address."})
            )
            return HttpResponseRedirect(url)
        # Check if already a user exists or not
        user = User.objects.filter(email=email).first()

        # Existing user
        if user:
            # Check user password
            if not user.check_password(password):
                url = (
                    referer
                    + "?"
                    + urlencode(
                        {
                            "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                        }
                    )
                )
                return HttpResponseRedirect(url)
        else:
            user = User.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(password),
                is_password_autoset=False,
            )
            _ = Profile.objects.create(user=user, company_name=company_name)
        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        # Register the user as an instance admin
        _ = InstanceAdmin.objects.create(
            user=user,
            instance=instance,
        )
        # Make the setup flag True
        instance.is_setup_done = True
        instance.is_telemetry_enabled = is_telemetry_enabled
        instance.save()

        # get tokens for user
        user_login(request=request, user=user)
        url = referer + "?" + urlencode({"success": "true"})
        return HttpResponseRedirect(url)


class SignUpScreenVisitedEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.is_signup_screen_visited = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
