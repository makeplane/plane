# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect
from django.views import View


# Module imports
from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.utils.mobile.login import (
    ValidateAuthToken,
    mobile_validate_user_onboarding,
)
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.authentication.utils.host import base_host
from plane.db.models import User
from plane.license.models import Instance
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.exception_logger import log_exception


class MobileMagicSignInEndpoint(View):
    def post(self, request):
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            # Redirection params
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            # Base URL join
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # set the referrer as session to redirect after login
        email = request.POST.get("email", False)
        code = request.POST.get("code", False)

        # Raise exception if any of the above are missing
        if not email or not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Existing User
        email = email.strip().lower()
        code = code.strip()

        existing_user = User.objects.filter(email=email).first()
        if not existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
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

            is_onboarded = mobile_validate_user_onboarding(user=user)
            if not is_onboarded:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["USER_NOT_ONBOARDED"],
                    error_message="USER_NOT_ONBOARDED",
                    payload={"email": str(email)},
                )
                params = exc.get_error_dict()
                url = urljoin(
                    base_host(request=request, is_app=True),
                    "m/auth/?" + urlencode(params),
                )
                return HttpResponseRedirect(url)

            # Login the user and record his device info
            session_token = ValidateAuthToken()
            session_token.set_value(str(user.id))

            # redirect to referrer path
            url = urljoin(
                base_host(request=request, is_app=True),
                "m/auth/?" + urlencode({"token": session_token.token}),
            )
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
        except ValueError as e:
            log_exception(e)
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["TOKEN_NOT_SET"],
                error_message="TOKEN_NOT_SET",
                payload={"email": str(email)},
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
