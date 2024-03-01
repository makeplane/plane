# Python imports
import os
import uuid
from datetime import datetime

import pytz
import requests

# Django import
from django.contrib.auth import login
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.views import View

# Module imports
from plane.db.models import Account, Profile, User, WorkspaceMemberInvite
from plane.license.utils.instance_value import get_configuration_value


class GoogleOauthInitiateEndpoint(View):

    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)

        print(request.get_host())
        # Get all the configuration
        (GOOGLE_CLIENT_ID,) = get_configuration_value(
            [
                {
                    "key": "GOOGLE_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_CLIENT_ID", None),
                },
            ]
        )

        if not GOOGLE_CLIENT_ID:
            return JsonResponse(
                {
                    "error": "Google is not configured please contact the support team"
                },
                status=400,
            )

        # Redirect to Google's OAuth 2.0 server
        scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        # return redirect
        redirect_uri = f"{request.get_host()}/auth/callback/google/"
        # google account url
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&scope={scope}&access_type=offline&prompt=consent"
        return redirect(auth_url)


class GoogleCallbackEndpoint(View):

    def get(self, request):
        # The user is redirected here by Google with a code
        code = request.GET.get("code")
        if code:
            token_url = "https://oauth2.googleapis.com/token"
            redirect_uri = "http://localhost:8000/auth/callback/google/"
            (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ENABLE_SIGNUP) = (
                get_configuration_value(
                    [
                        {
                            "key": "GOOGLE_CLIENT_ID",
                            "default": os.environ.get(
                                "GOOGLE_CLIENT_ID", None
                            ),
                        },
                        {
                            "key": "GOOGLE_CLIENT_SECRET",
                            "default": os.environ.get(
                                "GOOGLE_CLIENT_SECRET", None
                            ),
                        },
                        {
                            "key": "ENABLE_SIGNUP",
                            "default": os.environ.get("ENABLE_SIGNUP"),
                        },
                    ]
                )
            )
            data = {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
            token_response = requests.post(token_url, data=data).json()
            access_token = token_response.get("access_token")
            if not access_token:
                return redirect(
                    "login"
                )  # Redirect or handle error appropriately

            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            user_info_response = requests.get(
                user_info_url, headers=headers
            ).json()

            email = user_info_response.get("email", False)

            if not email:
                return redirect("login")

            user = User.objects.filter(email=email).first()

            if user:
                # Get or create the user account
                account, created = Account.objects.get_or_create(
                    user=user,
                    provider="google",
                    defaults={
                        "provider_account_id": user_info_response.get("id"),
                        "access_token": token_response.get("access_token"),
                        "refresh_token": token_response.get(
                            "refresh_token", None
                        ),
                        "access_token_expired_at": (
                            datetime.fromtimestamp(
                                token_response.get("expires_in"),
                                tz=pytz.utc,
                            )
                            if token_response.get("expires_in")
                            else None
                        ),
                        "refresh_token_expired_at": (
                            datetime.fromtimestamp(
                                token_response.get("refresh_token_expired_at"),
                                tz=pytz.utc,
                            )
                            if token_response.get("refresh_token_expired_at")
                            else None
                        ),
                    },
                )
                if not created:
                    # account access and refresh token
                    account.access_token = token_response.get("access_token")
                    account.access_token_expired_at = (
                        datetime.fromtimestamp(
                            token_response.get("expires_in"),
                            tz=pytz.utc,
                        )
                        if token_response.get("expires_in")
                        else None
                    )
                    account.metadata = token_response.get("metadata", {})

                # last connected at
                account.last_connected_at = timezone.now()
                account.save()

                # Update user creds
                user.last_login_medium = "google"
                user.last_active = timezone.now()
                user.last_login_time = timezone.now()
                user.last_login_ip = request.META.get("REMOTE_ADDR")
                user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
                user.token_updated_at = timezone.now()
                user.save()
                login(request=request, user=user)
                return redirect(request.session["referer"])
            else:
                if (
                    ENABLE_SIGNUP == "0"
                    and not WorkspaceMemberInvite.objects.filter(
                        email=email,
                    ).exists()
                ):
                    return redirect("login")

                user = User.objects.create(
                    email=email, username=uuid.uuid4().hex
                )
                user.set_password(uuid.uuid4().hex)
                # Create profile
                _ = Profile.objects.create(user=user)

                account = Account.objects.create(
                    user=user,
                    provider="google",
                    provider_account_id=user_info_response.get("id"),
                    access_token=token_response.get("access_token"),
                    access_token_expired_at=(
                        datetime.fromtimestamp(
                            token_response.get("expires_in"),
                            tz=pytz.utc,
                        )
                        if token_response.get("expires_in")
                        else None
                    ),
                    refresh_token=token_response.get("refresh_token", None),
                    refresh_token_expired_at=(
                        datetime.fromtimestamp(
                            token_response.get("refresh_token_expired_at"),
                            tz=pytz.utc,
                        )
                        if token_response.get("refresh_token_expired_at")
                        else None
                    ),
                    metadata=request.data.get("metadata", {}),
                )
                # User
                user.last_login_medium = "google"
                user.avatar = user_info_response.get("picture")
                user.first_name = user_info_response.get("given_name")
                user.last_name = user_info_response.get("family_name")
                user.last_active = timezone.now()
                user.last_login_time = timezone.now()
                user.last_login_ip = request.META.get("REMOTE_ADDR")
                user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
                user.token_updated_at = timezone.now()
                user.save()
                login(request=request, user=user)
                return redirect(request.session["referer"])
        return redirect("login")
