# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.provider.credentials.magic_code import (
    MagicCodeProvider,
)
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import (
    post_user_auth_workflow,
)
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.db.models import User, Profile
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class MagicGenerateEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "INSTANCE_NOT_CONFIGURED"
                ],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(
                exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST
            )

        origin = request.META.get("HTTP_ORIGIN", "/")
        email = request.data.get("email", False)
        try:
            # Clean up the email
            email = email.strip().lower()
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # If the smtp is configured send through here
            magic_link.delay(email, key, token, origin)
            return Response({"key": str(key)}, status=status.HTTP_200_OK)
        except AuthenticationException as e:
            params = e.get_error_dict()
            return Response(
                params,
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInEndpoint(View):

    def post(self, request):

        # set the referer as session to redirect after login
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()
        next_path = request.POST.get("next_path")

        if code == "" or email == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        # Existing User
        existing_user = User.objects.filter(email=email).first()

        if not existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        if not existing_user.is_active:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "USER_ACCOUNT_DEACTIVATED"
                ],
                error_message="USER_ACCOUNT_DEACTIVATED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            profile = Profile.objects.get(user=user)
            # Login the user and record his device info
            user_login(request=request, user=user, is_app=True)
            if user.is_password_autoset and profile.is_onboarded:
                path = "accounts/set-password"
            else:
                # Get the redirection path
                path = (
                    str(next_path)
                    if next_path
                    else str(get_redirection_path(user=user))
                )
            # redirect to referer path
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)


class MagicSignUpEndpoint(View):

    def post(self, request):

        # set the referer as session to redirect after login
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()
        next_path = request.POST.get("next_path")

        if code == "" or email == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        # Existing user
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXIST"],
                error_message="USER_ALREADY_EXIST",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user, is_app=True)
            # Get the redirection path
            if next_path:
                path = str(next_path)
            else:
                path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
