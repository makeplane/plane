# Python imports
from urllib.parse import urlencode

# Django imports
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
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

        # set the referer as session to redirect after login
        request.session["referer"] = referer
        email = request.POST.get("email", False)
        if not email:
            url = (
                referer
                + "?"
                + urlencode({"error": "Please provide a valid email address"})
            )
            return HttpResponseRedirect(url)
        try:
            # Clean up the email
            email = email.strip().lower()
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # If the smtp is configured send through here
            magic_link.delay(email, key, token, referer)
            return HttpResponseRedirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)

        except ValidationError:
            url = referer + "?" + urlencode({"error": "Invalid email used"})
            return HttpResponseRedirect(url)


class MagicSignInEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        # set the referer as session to redirect after login
        request.session["referer"] = referer
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            url = (
                referer
                + "?"
                + urlencode({"error": "Instance is not configured"})
            )
            return HttpResponseRedirect(url)
        user_token = request.POST.get("token", "").strip()
        key = request.POST.get("key", "").strip().lower()

        if not key or user_token == "":
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
            login(request=request, user=user)
            return HttpResponseRedirect(request.session.get("referer"))
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
