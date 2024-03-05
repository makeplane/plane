# Python imports
from urllib.parse import urlencode

# Django imports
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

from plane.authentication.adapter.base import AuthenticationException

# Module imports
from plane.authentication.provider.credentials.email import EmailProvider


class SignInAuthEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        # set the referer as session to redirect after login
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        ## Raise exception if any of the above are missing
        if not email or not password:
            url = (
                referer
                + "?"
                + urlencode({"error": "Both email and password are required"})
            )
            return HttpResponseRedirect(url)

        # Validate email
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
        try:
            provider = EmailProvider(
                request=request, key=email, code=password, is_signup=False
            )
            user = provider.authenticate()
            login(request=request, user=user)
            return HttpResponseRedirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)


class SignUpAuthEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")

        email = request.POST.get("email", False)
        password = request.POST.get("password", False)
        ## Raise exception if any of the above are missing
        if not email or not password:
            url = (
                referer
                + "?"
                + urlencode({"error": "Both email and password are required"})
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
        try:
            provider = EmailProvider(
                request=request, key=email, code=password, is_signup=True
            )
            user = provider.authenticate()
            login(request=request, user=user)
            return HttpResponseRedirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
