# Python imports
from urllib.parse import urlencode

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
from plane.authentication.provider.credentials.magic_code_adapter import (
    MagicCodeProvider,
)
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance


class MagicGenerateEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response({"error": "Instance is not configured"})

        origin = request.META.get("HTTP_ORIGIN", "/")
        email = request.POST.get("email", False)
        try:
            # Clean up the email
            email = email.strip().lower()
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # If the smtp is configured send through here
            magic_link.delay(email, key, token, origin)
            return Response({"key", str(key)}, status=status.HTTP_200_OK)
        except ImproperlyConfigured as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )
        except AuthenticationException as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError:
            return Response(
                {
                    "error": "Valid email is required for generating a magic code"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        # set the referer as session to redirect after login
        request.session["referer"] = referer
        user_token = request.POST.get("token", "").strip()
        key = request.POST.get("key", "").strip().lower()

        if key == "" or user_token == "":
            url = (
                referer
                + "?"
                + urlencode({"error": "User token and key are required"})
            )
            return HttpResponseRedirect(url)
        try:
            provider = MagicCodeProvider(
                request=request, key=key, code=user_token
            )
            user = provider.authenticate()
            user_login(request=request, user=user)
            process_workspace_project_invitations(user=user)
            url = referer + "?" + urlencode({"success": "true"})
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
