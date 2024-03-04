# Python imports
import os

# Django imports
from django.contrib.auth import login
from django.core.validators import validate_email
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View
from rest_framework import status

# Third party imports
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.views.auth.provider.credentials.magic_code_adapter import (
    MagicCodeProvider,
)
from plane.bgtasks.magic_link_code_task import magic_link
from plane.db.models import (
    WorkspaceMemberInvite,
)
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value


class MagicGenerateEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)
        # set the referer as session to redirect after login
        request.session["referer"] = referer
        email = request.POST.get("email", False)
        if not email:
            return JsonResponse(
                {"error": "Please provide a valid email address"},
                status=400,
            )

        # Clean up the email
        email = email.strip().lower()
        validate_email(email)

        adapter = MagicCodeProvider(request=request, key=email)
        key, token, error = adapter.initiate()

        if error:
            return JsonResponse(error, status=400)

        # If the smtp is configured send through here
        magic_link.delay(email, key, token, referer)

        return JsonResponse({"key": key}, status=status.HTTP_200_OK)


class MagicSignInEndpoint(View):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return JsonResponse(
                {"error": "Instance is not configured"},
                status=400,
            )

        user_token = request.POST.get("token", "").strip()
        key = request.POST.get("key", "").strip().lower()

        if not key or user_token == "":
            return JsonResponse(
                {"error": "User token and key are required"},
                status=400,
            )

        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )

        provider = MagicCodeProvider(request=request, key=key, code=user_token)

        user, email = provider.authenticate()

        if user:
            user = provider.complete_login_or_signup()
            login(request=request, user=user)
            return redirect(request.session.get("referer"))
        else:
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                return redirect(request.session.get("referer"))
            user = provider.complete_login_or_signup(is_signup=True)
            login(request=request, user=user)
            return redirect(request.session.get("referer"))
