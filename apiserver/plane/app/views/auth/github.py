# Python imports
import os

import requests

# Django import
from django.contrib.auth import login
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

# Module imports
from plane.db.models import User, WorkspaceMemberInvite
from plane.license.utils.instance_value import get_configuration_value

from .adapter.github import GithubAuthProvider


class GithubOauthInitiateEndpoint(View):

    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)
        # set the referer as session to redirect after login
        request.session["referer"] = referer
        # Get all the configuration
        (GITHUB_CLIENT_ID,) = get_configuration_value(
            [
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID", None),
                },
            ]
        )

        if not GITHUB_CLIENT_ID:
            return JsonResponse(
                {
                    "error": "Github is not configured please contact the support team"
                },
                status=400,
            )

        # Redirect to Google's OAuth 2.0 server
        provider = GithubAuthProvider(
            client_id=GITHUB_CLIENT_ID,
            request=request,
        )
        auth_url = provider.get_auth_url()
        return redirect(auth_url)


class GithubCallbackEndpoint(View):

    def get(self, request):
        code = request.GET.get("code")
        if code:
            # Get all the configuration
            (
                GITHUB_CLIENT_ID,
                GITHUB_CLIENT_SECRET,
                ENABLE_SIGNUP,
            ) = get_configuration_value(
                [
                    {
                        "key": "GITHUB_CLIENT_ID",
                        "default": os.environ.get("GITHUB_CLIENT_ID", None),
                    },
                    {
                        "key": "GITHUB_CLIENT_SECRET",
                        "default": os.environ.get(
                            "GITHUB_CLIENT_SECRET", None
                        ),
                    },
                    {
                        "key": "ENABLE_SIGNUP",
                        "default": os.environ.get("ENABLE_SIGNUP"),
                    },
                ]
            )
            provider = GithubAuthProvider(
                client_id=GITHUB_CLIENT_ID,
                client_secret=GITHUB_CLIENT_SECRET,
                request=request,
            )
            provider_response = provider.get_user_response(code=code)
            # check user
            user = User.objects.filter(
                email=provider_response.get("email")
            ).first()

            if user:
                user = provider.complete_login(
                    user=user, provider_response=provider_response
                )
                login(request=request, user=user)
                return redirect(request.session["referer"])
            else:
                if (
                    ENABLE_SIGNUP == "0"
                    and not WorkspaceMemberInvite.objects.filter(
                        email=provider_response.get("email"),
                    ).exists()
                ):
                    return redirect(request.session["referer"])

                user = provider.complete_signup(
                    provider_response=provider_response
                )
                login(request=request, user=user)
                return redirect(request.session.get("referer"))
        return redirect(request.session.get("referer"))
