# Python imports
from urllib.parse import urlencode, urljoin
import uuid
from zxcvbn import zxcvbn

# Django imports
from django.http import HttpResponseRedirect
from django.views import View
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.contrib.auth import logout

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers import (
    InstanceAdminMeSerializer,
    InstanceAdminSerializer,
)
from plane.license.models import Instance, InstanceAdmin
from plane.db.models import User, Profile, Workspace, Site
from plane.utils.cache import cache_response, invalidate_cache
from plane.authentication.utils.login import user_login
from plane.authentication.utils.host import base_host


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

    @cache_response(60 * 60 * 2, user=False)
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


class InstanceAdminSignUpEndpoint(View):
    permission_classes = [
        AllowAny,
    ]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            url = urljoin(
                base_host(request=request),
                "god-mode/setup?"
                + urlencode(
                    {
                        "error_code": "INSTANCE_NOT_CONFIGURED",
                        "error_message": "Instance is not configured",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # check if the instance has already an admin registered
        if InstanceAdmin.objects.first():
            url = urljoin(
                base_host(request=request),
                "god-mode/setup?"
                + urlencode(
                    {
                        "error_code": "ADMIN_ALREADY_EXIST",
                        "error_message": "Admin for the instance has been already registered.",
                    }
                ),
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
            url = urljoin(
                base_host(request=request),
                "god-mode/setup?"
                + urlencode(
                    {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "company_name": company_name,
                        "is_telemetry_enabled": is_telemetry_enabled,
                        "error_code": "REQUIRED_EMAIL_PASSWORD_FIRST_NAME",
                        "error_message": "Email, name and password are required",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            url = urljoin(
                base_host(request=request),
                "god-mode/setup?"
                + urlencode(
                    {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "company_name": company_name,
                        "is_telemetry_enabled": is_telemetry_enabled,
                        "error_code": "INVALID_EMAIL",
                        "error_message": "Please provide a valid email address.",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Check if already a user exists or not
        # Existing user
        if User.objects.filter(email=email).exists():
            url = urljoin(
                base_host(request=request),
                "god-mode/setup?"
                + urlencode(
                    {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "company_name": company_name,
                        "is_telemetry_enabled": is_telemetry_enabled,
                        "error_code": "USER_ALREADY_EXISTS",
                        "error_message": "User already exists.",
                    }
                ),
            )
            return HttpResponseRedirect(url)
        else:

            results = zxcvbn(password)
            if results["score"] < 3:
                url = urljoin(
                    base_host(request=request),
                    "god-mode/setup?"
                    + urlencode(
                        {
                            "email": email,
                            "first_name": first_name,
                            "last_name": last_name,
                            "company_name": company_name,
                            "is_telemetry_enabled": is_telemetry_enabled,
                            "error_code": "INVALID_PASSWORD",
                            "error_message": "Invalid password provided.",
                        }
                    ),
                )
                return HttpResponseRedirect(url)

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
            url = urljoin(base_host(request=request), "god-mode/general")
            return HttpResponseRedirect(url)


class InstanceAdminSignInEndpoint(View):
    permission_classes = [
        AllowAny,
    ]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "error_code": "INSTANCE_NOT_CONFIGURED",
                        "error_message": "Instance is not configured",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Get email and password
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        # return error if the email and password is not present
        if not email or not password:
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "email": email,
                        "error_code": "REQUIRED_EMAIL_PASSWORD",
                        "error_message": "Email and password are required",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "email": email,
                        "error_code": "INVALID_EMAIL",
                        "error_message": "Please provide a valid email address.",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Fetch the user
        user = User.objects.filter(email=email).first()

        # Error out if the user is not present
        if not user:
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "email": email,
                        "error_code": "USER_DOES_NOT_EXIST",
                        "error_message": "User does not exist",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Check password of the user
        if not user.check_password(password):
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "email": email,
                        "error_code": "AUTHENTICATION_FAILED",
                        "error_message": "Sorry, we could not find an admin user with the provided credentials. Please try again.",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        # Check if the user is an instance admin
        if not InstanceAdmin.objects.filter(instance=instance, user=user):
            url = urljoin(
                base_host(request=request),
                "god-mode/login?"
                + urlencode(
                    {
                        "email": email,
                        "error_code": "AUTHENTICATION_FAILED",
                        "error_message": "Sorry, we could not find an admin user with the provided credentials. Please try again.",
                    }
                ),
            )
            return HttpResponseRedirect(url)
        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        # get tokens for user
        user_login(request=request, user=user)
        url = urljoin(base_host(request=request), "god-mode/general")
        return HttpResponseRedirect(url)


class InstanceAdminUserMeEndpoint(BaseAPIView):

    permission_classes = [
        InstanceAdminPermission,
    ]

    def get(self, request):
        serializer = InstanceAdminMeSerializer(request.user)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class InstanceAdminSignOutEndpoint(View):

    permission_classes = [
        InstanceAdminPermission,
    ]

    def post(self, request):
        logout(request)
        url = urljoin(
            base_host(request=request),
            "god-mode/login?" + urlencode({"success": "true"}),
        )
        return HttpResponseRedirect(url)


class InstanceWorkspacesEndpoint(BaseAPIView):
    permission_classes = [
        InstanceAdminPermission,
    ]

    def get(self, request):
        workspace = Workspace.objects.values()
        return Response(workspace, status=status.HTTP_200_OK)


class PrimaryWorkspaceEndpoint(BaseAPIView):

    permission_classes = [
        InstanceAdminPermission,
    ]

    def post(self, request):
        # Get the id of the primary workspace
        primary_workspace_id = request.data.get("primary_workspace_id", False)

        # Throw error is the primary workspace is not specified
        if not primary_workspace_id:
            return Response(
                {"error": "Primary workspace id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the primary workspace
        primary_workspace = Workspace.objects.get(pk=primary_workspace_id)

        # Check if the site exists or not
        site = Site.objects.first()
        if not site:
            # Create a Site
            site = Site.objects.create(
                name=primary_workspace.name,
                owner=primary_workspace.owner,
                domain=f"{request.get_host()}",
                user_count=User.objects.count(),
            )

        # Attach this site to all workspaces
        Workspace.objects.update(site=site, is_primary=False)

        # Update the primary workspace
        primary_workspace.is_primary = True
        primary_workspace.site = site
        primary_workspace.save()

        return Response(
            {"message": "Primary workspace created succesfully"},
            status=status.HTTP_200_OK,
        )
