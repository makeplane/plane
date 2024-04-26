# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.adapter.base import AuthenticationException
from plane.authentication.provider.credentials.email import EmailProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.db.models import User


class SignInAuthEndpoint(View):

    def post(self, request):
        next_path = request.POST.get("next_path")
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            # Redirection params
            params = {
                "error_code": "REQUIRED_EMAIL_PASSWORD",
                "error_message": "Both email and password are required",
            }
            if next_path:
                params["next_path"] = str(next_path)
            # Base URL join
            url = urljoin(
                base_host(request=request),
                "accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        # set the referer as session to redirect after login
        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        ## Raise exception if any of the above are missing
        if not email or not password:
            # Redirection params
            params = {
                "error_code": "REQUIRED_EMAIL_PASSWORD",
                "error_message": "Both email and password are required",
            }
            # Next path
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            params = {
                "error_code": "INVALID_EMAIL",
                "error_message": "Please provide a valid email address.",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        if not User.objects.filter(email=email).exists():
            params = {
                "error_code": "USER_DOES_NOT_EXIST",
                "error_message": "User could not be found with the given email.",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = EmailProvider(
                request=request, key=email, code=password, is_signup=False
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            if next_path:
                path = str(next_path)
            else:
                path = get_redirection_path(user=user)

            # redirect to referer path
            url = urljoin(base_host(request=request), path)
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
                "accounts/sign-in?" + urlencode(params),
            )
            return HttpResponseRedirect(url)


class SignUpAuthEndpoint(View):

    def post(self, request):
        next_path = request.POST.get("next_path")
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            params = {
                "error_code": "INSTANCE_NOT_CONFIGURED",
                "error_message": "Instance is not configured",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        email = request.POST.get("email", False)
        password = request.POST.get("password", False)
        ## Raise exception if any of the above are missing
        if not email or not password:
            params = {
                "error_code": "REQUIRED_EMAIL_PASSWORD",
                "error_message": "Both email and password are required",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            params = {
                "error_code": "INVALID_EMAIL",
                "error_message": "Please provide a valid email address.",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        if User.objects.filter(email=email).exists():
            params = {
                "error_code": "USER_ALREADY_EXIST",
                "error_message": "User already exists with the email.",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = EmailProvider(
                request=request, key=email, code=password, is_signup=True
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            if next_path:
                path = next_path
            else:
                path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(base_host(request=request), path)
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
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
