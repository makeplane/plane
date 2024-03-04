# Python imports
import os

# Django imports
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

from plane.app.views.auth.adapter.base import AuthenticationException

# Module imports
from plane.app.views.auth.provider.credentials.magic_code_adapter import (
    MagicCodeProvider,
)
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance


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
        try:
            # Clean up the email
            email = email.strip().lower()
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # If the smtp is configured send through here
            magic_link.delay(email, key, token, referer)
            return redirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            return JsonResponse({"error": str(e)}, status=400)
        except ValidationError:
            return JsonResponse({"error": "Invalid email used"}, status=400)


class MagicSignInEndpoint(View):

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
        try:
            provider = MagicCodeProvider(
                request=request, key=key, code=user_token
            )
            user = provider.authenticate()
            login(request=request, user=user)
            return redirect(request.session.get("referer"))
        except AuthenticationException as e:
            return JsonResponse({"error": str(e)}, status=403)
