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
from plane.db.models import User, Profile
from plane.utils.cache import cache_response, invalidate_cache
from plane.authentication.utils.login import user_login
from plane.authentication.utils.host import base_host, user_ip
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.utils.ip_address import get_client_ip
from plane.utils.path_validator import get_safe_redirect_url


class InstanceAdminEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    @invalidate_cache(path="/api/instances/", user=False)
    # Create an instance admin
    def post(self, request):
        email = request.data.get("email", False)
        role = request.data.get("role", 20)

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        instance = Instance.objects.first()
        if instance is None:
            return Response(
                {"error": "Instance is not registered yet"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Fetch the user
        user = User.objects.get(email=email)

        instance_admin = InstanceAdmin.objects.create(instance=instance, user=user, role=role)
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
    permission_classes = [AllowAny]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # check if the instance has already an admin registered
        if InstanceAdmin.objects.first():
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_ALREADY_EXIST"],
                error_message="ADMIN_ALREADY_EXIST",
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
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
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME"],
                error_message="REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME",
                payload={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "company_name": company_name,
                    "is_telemetry_enabled": is_telemetry_enabled,
                },
            )
            url = urljoin(
                base_host(
                    request=request,
                    is_admin=True,
                ),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_ADMIN_EMAIL"],
                error_message="INVALID_ADMIN_EMAIL",
                payload={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "company_name": company_name,
                    "is_telemetry_enabled": is_telemetry_enabled,
                },
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Check if already a user exists or not
        # Existing user
        if User.objects.filter(email=email).exists():
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_USER_ALREADY_EXIST"],
                error_message="ADMIN_USER_ALREADY_EXIST",
                payload={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "company_name": company_name,
                    "is_telemetry_enabled": is_telemetry_enabled,
                },
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)
        else:
            results = zxcvbn(password)
            if results["score"] < 3:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_ADMIN_PASSWORD"],
                    error_message="INVALID_ADMIN_PASSWORD",
                    payload={
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "company_name": company_name,
                        "is_telemetry_enabled": is_telemetry_enabled,
                    },
                )
                url = urljoin(
                    base_host(request=request, is_admin=True),
                    "?" + urlencode(exc.get_error_dict()),
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
            user.last_login_ip = get_client_ip(request=request)
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            # Register the user as an instance admin
            _ = InstanceAdmin.objects.create(user=user, instance=instance)
            # Make the setup flag True
            instance.is_setup_done = True
            instance.instance_name = company_name
            instance.is_telemetry_enabled = is_telemetry_enabled
            instance.save()

            # get tokens for user
            user_login(request=request, user=user, is_admin=True)
            url = urljoin(base_host(request=request, is_admin=True), "general/")
            return HttpResponseRedirect(url)


class InstanceAdminSignInEndpoint(View):
    permission_classes = [AllowAny]

    @invalidate_cache(path="/api/instances/", user=False)
    def post(self, request):
        # Check instance first
        instance = Instance.objects.first()
        if instance is None:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Get email and password
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        # return error if the email and password is not present
        if not email or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["REQUIRED_ADMIN_EMAIL_PASSWORD"],
                error_message="REQUIRED_ADMIN_EMAIL_PASSWORD",
                payload={"email": email},
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_ADMIN_EMAIL"],
                error_message="INVALID_ADMIN_EMAIL",
                payload={"email": email},
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Fetch the user
        user = User.objects.filter(email=email).first()

        # Error out if the user is not present
        if not user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_USER_DOES_NOT_EXIST"],
                error_message="ADMIN_USER_DOES_NOT_EXIST",
                payload={"email": email},
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # is_active
        if not user.is_active:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_USER_DEACTIVATED"],
                error_message="ADMIN_USER_DEACTIVATED",
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Check password of the user
        if not user.check_password(password):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_AUTHENTICATION_FAILED"],
                error_message="ADMIN_AUTHENTICATION_FAILED",
                payload={"email": email},
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)

        # Check if the user is an instance admin
        if not InstanceAdmin.objects.filter(instance=instance, user=user):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ADMIN_AUTHENTICATION_FAILED"],
                error_message="ADMIN_AUTHENTICATION_FAILED",
                payload={"email": email},
            )
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)
        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = get_client_ip(request=request)
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        # get tokens for user
        user_login(request=request, user=user, is_admin=True)
        url = urljoin(base_host(request=request, is_admin=True), "general/")
        return HttpResponseRedirect(url)


class InstanceAdminUserMeEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        serializer = InstanceAdminMeSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceAdminUserSessionEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated and InstanceAdmin.objects.filter(user=request.user).exists():
            serializer = InstanceAdminMeSerializer(request.user)
            data = {"is_authenticated": True}
            data["user"] = serializer.data
            return Response(data, status=status.HTTP_200_OK)
        else:
            return Response({"is_authenticated": False}, status=status.HTTP_200_OK)


class InstanceAdminSignOutEndpoint(View):
    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        # Get user
        try:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save()
            # Log the user out
            logout(request)
            url = get_safe_redirect_url(base_url=base_host(request=request, is_admin=True), next_path="")
            return HttpResponseRedirect(url)
        except Exception:
            url = get_safe_redirect_url(base_url=base_host(request=request, is_admin=True), next_path="")
            return HttpResponseRedirect(url)
