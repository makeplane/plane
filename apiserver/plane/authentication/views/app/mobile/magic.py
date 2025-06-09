# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.rate_limit import AuthenticationThrottle
from plane.authentication.utils.host import base_host
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.bgtasks.magic_link_code_task import magic_link
from plane.db.models import User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance
from plane.utils.exception_logger import log_exception


class MobileMagicGenerateEndpoint(APIView):
    permission_classes = [AllowAny]

    throttle_classes = [AuthenticationThrottle]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get("email", "").strip().lower()
        try:
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # If the smtp is configured send through here
            magic_link.delay(email, key, token)
            return Response({"key": str(key)}, status=status.HTTP_200_OK)
        except AuthenticationException as e:
            params = e.get_error_dict()
            return Response(params, status=status.HTTP_400_BAD_REQUEST)


class MobileMagicSignUpEndpoint(View):
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
        code = request.POST.get("code", "")

        # Prepare response payload params
        response_payload_params = {
            "email": str(email),
        }
        if invitation_id != "":
            response_payload_params["invitation_id"] = str(invitation_id)

        # Raise exception if email or code is missing
        if email == "" or code == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
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

        # check if user already exists
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
            code = code.strip()

            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
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

        # Get request payload
        invitation_id = str(request.POST.get("invitation_id", "")).strip()
        email = str(request.POST.get("email", "")).strip().lower()
        code = request.POST.get("code", "")

        # Prepare response payload params
        response_payload_params = {
            "email": str(email),
        }
        if invitation_id != "":
            response_payload_params["invitation_id"] = str(invitation_id)

        # Raise exception if email or code is missing
        if email == "" or code == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"
                ],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
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
            code = code.strip()

            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
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
