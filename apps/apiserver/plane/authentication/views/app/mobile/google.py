# Python imports
import uuid
from urllib.parse import urlencode, urljoin

# Django import
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.views import View

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.oauth.google import GoogleOAuthProvider
from plane.authentication.utils.host import base_host
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance


class MobileGoogleOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        try:
            invitation_id = request.GET.get("invitation_id")
            scheme = (
                "https"
                if settings.IS_HEROKU
                else "https"
                if request.is_secure()
                else "http"
            )
            redirect_uri = (
                f"""{scheme}://{request.get_host()}/auth/mobile/google/callback/"""
            )

            state = uuid.uuid4().hex
            provider = GoogleOAuthProvider(
                request=request, state=state, redirect_uri=redirect_uri
            )
            request.session["state"] = state
            request.session["invitation_id"] = invitation_id
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class MobileGoogleCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base_host = request.session.get("host")
        invitation_id = request.session.get("invitation_id")

        response_payload_params = {}
        if invitation_id:
            response_payload_params["invitation_id"] = invitation_id

        # validating the session state is matching or not
        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        #  validating the code that have given by google provider
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
                payload=response_payload_params,
            )
            params = exc.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            scheme = (
                "https"
                if settings.IS_HEROKU
                else "https"
                if request.is_secure()
                else "http"
            )
            redirect_uri = (
                f"""{scheme}://{request.get_host()}/auth/mobile/google/callback/"""
            )
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
                callback=post_user_auth_workflow,
                redirect_uri=redirect_uri,
            )

            # getting the user from the google provider
            user = provider.authenticate()
            user_id = str(user.id)
            user_email = user.email

            # Login the user and record his device info
            session_token = ValidateAuthToken()
            session_token.set_value(user_id)

            # if invitation_id is present
            if invitation_id != "" and user_email:
                # check the invitation is valid
                invitation = WorkspaceMemberInvite.objects.filter(
                    id=invitation_id, email=user_email
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
                base_host, "m/auth/?" + urlencode({"token": session_token.token})
            )

            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)
