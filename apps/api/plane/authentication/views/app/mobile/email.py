# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.views import View

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.email import EmailProvider
from plane.authentication.utils.host import base_host
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance
from plane.utils.exception_logger import log_exception


class MobileSignUpAuthEndpoint(View):
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

        # Get request payload
        invitation_id = str(request.POST.get("invitation_id", "")).strip()
        email = str(request.POST.get("email", "")).strip().lower()
        password = request.POST.get("password", "")

        # Prepare response payload params
        response_payload_params = {
            "email": str(email),
        }
        if invitation_id != "":
            response_payload_params["invitation_id"] = str(invitation_id)

        # Raise exception if email or password is missing
        if email == "" or password == "":
            # Redirection params
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "REQUIRED_EMAIL_PASSWORD_SIGN_IN"
                ],
                error_message="REQUIRED_EMAIL_PASSWORD_SIGN_IN",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Validate email
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL_SIGN_IN"],
                error_message="INVALID_EMAIL_SIGN_IN",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXIST"],
                error_message="USER_ALREADY_EXIST",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        try:
            provider = EmailProvider(
                request=request,
                key=email,
                code=password,
                is_signup=True,
                callback=post_user_auth_workflow,
                invitation_id=invitation_id,
            )
            user = provider.authenticate()
            user_id = str(user.id)

            # Login the user and record his device info
            session_token = ValidateAuthToken()
            session_token.set_value(user_id)

            # if invitation_id is present
            if invitation_id != "":
                # check the invitation is valid
                invitation = WorkspaceMemberInvite.objects.filter(
                    id=invitation_id, email=email
                ).first()

                # if not invitation.responded_at and invitation.accepted:
                if invitation and not invitation.responded_at and invitation.accepted:
                    # check the workspace is valid
                    workspace = Workspace.objects.filter(
                        id=invitation.workspace_id
                    ).first()

                    if workspace:
                        invitation.responded_at = timezone.now()
                        invitation.save()

                        # add the user to the workspace
                        workspace_member, _ = WorkspaceMember.objects.get_or_create(
                            workspace_id=invitation.workspace.id,
                            member_id=user_id,
                        )
                        workspace_member.role = invitation.role
                        workspace_member.save()

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
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class MobileSignInAuthEndpoint(View):
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

        # Get request payload
        invitation_id = str(request.POST.get("invitation_id", "")).strip()
        email = str(request.POST.get("email", "")).strip().lower()
        password = request.POST.get("password", "")

        # Prepare response payload params
        response_payload_params = {
            "email": str(email),
        }
        if invitation_id != "":
            response_payload_params["invitation_id"] = str(invitation_id)

        # Raise exception if email or password is missing
        if email == "" or password == "":
            # Redirection params
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "REQUIRED_EMAIL_PASSWORD_SIGN_IN"
                ],
                error_message="REQUIRED_EMAIL_PASSWORD_SIGN_IN",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL_SIGN_IN"],
                error_message="INVALID_EMAIL_SIGN_IN",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        existing_user = User.objects.filter(email=email).first()
        if not existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        try:
            provider = EmailProvider(
                request=request,
                key=email,
                code=password,
                is_signup=False,
                callback=post_user_auth_workflow,
                invitation_id=invitation_id,
            )
            user = provider.authenticate()
            user_id = str(user.id)

            # Login the user and record his device info
            session_token = ValidateAuthToken()
            session_token.set_value(user_id)

            # if invitation_id is present
            if invitation_id != "":
                # check the invitation is valid
                invitation = WorkspaceMemberInvite.objects.filter(
                    id=invitation_id, email=email
                ).first()

                # if not invitation.responded_at and invitation.accepted:
                if invitation and not invitation.responded_at and invitation.accepted:
                    # check the workspace is valid
                    workspace = Workspace.objects.filter(
                        id=invitation.workspace_id
                    ).first()

                    if workspace:
                        invitation.responded_at = timezone.now()
                        invitation.save()

                        # add the user to the workspace
                        workspace_member, _ = WorkspaceMember.objects.get_or_create(
                            workspace_id=invitation.workspace.id,
                            member_id=user_id,
                        )
                        workspace_member.role = invitation.role
                        workspace_member.save()

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
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
