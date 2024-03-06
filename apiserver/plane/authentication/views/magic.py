# Python imports
from urllib.parse import urlencode

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

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
            user_login(request=request, user=user)
            process_workspace_project_invitations(user=user)
            return HttpResponseRedirect(request.session.get("referer"))
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
