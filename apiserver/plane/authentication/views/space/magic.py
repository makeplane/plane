# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.adapter.base import AuthenticationException
from plane.authentication.provider.credentials.magic_code import (
    MagicCodeProvider,
)
from plane.authentication.utils.login import user_login
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance
from plane.authentication.utils.host import base_host


class MagicGenerateSpaceEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {
                    "error_code": "INSTANCE_NOT_CONFIGURED",
                    "error_message": "Instance is not configured",
                }
            )

        origin = base_host(request=request)
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
        except ImproperlyConfigured as e:
            return Response(
                {
                    "error_code": "IMPROPERLY_CONFIGURED",
                    "error_message": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except AuthenticationException as e:
            return Response(
                {
                    "error_code": str(e.error_code),
                    "error_message": str(e.error_message),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValidationError:
            return Response(
                {
                    "error_code": "INVALID_EMAIL",
                    "error_message": "Valid email is required for generating a magic code",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInSpaceEndpoint(View):

    def post(self, request):

        # set the referer as session to redirect after login
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()
        next_path = request.POST.get("next_path")

        if code == "" or email == "":
            params = {
                "error_code": "EMAIL_CODE_REQUIRED",
                "error_message": "Email and code are required",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "spaces/accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        try:
            provider = MagicCodeProvider(
                request=request, key=f"magic_{email}", code=code
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # redirect to referer path
            url = urljoin(
                base_host(request=request),
                str(next_path) if next_path else "spaces",
            )
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = {
                "error_code": str(e.error_code),
                "error_message": str(e.error_message),
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "spaces/accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
