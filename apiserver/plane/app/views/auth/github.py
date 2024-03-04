# Python imports
import os

# Django import
from django.contrib.auth import login
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

# Module imports
from plane.app.views.auth.adapter.github_adapter import GithubAuthAdapter
from plane.db.models import WorkspaceMemberInvite
from plane.license.utils.instance_value import get_configuration_value


class GithubOauthInitiateEndpoint(View):

    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)

        request.session["referer"] = referer
        (GITHUB_CLIENT_ID,) = get_configuration_value(
            [
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID"),
                }
            ]
        )

        if not GITHUB_CLIENT_ID:
            return JsonResponse(
                {
                    "error": "Github is not configured. Please contact the support team."
                },
                status=400,
            )

        provider = GithubAuthAdapter(
            request=request, client_id=GITHUB_CLIENT_ID
        )
        auth_url = provider.get_auth_url()
        return redirect(auth_url)


class GithubCallbackEndpoint(View):

    def get(self, request):
        code = request.GET.get("code")
        if not code:
            return redirect(request.session.get("referer"))

        GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ENABLE_SIGNUP = (
            get_configuration_value(
                [
                    {
                        "key": "GITHUB_CLIENT_ID",
                        "default": os.environ.get("GITHUB_CLIENT_ID"),
                    },
                    {
                        "key": "GITHUB_CLIENT_SECRET",
                        "default": os.environ.get("GITHUB_CLIENT_SECRET"),
                    },
                    {
                        "key": "ENABLE_SIGNUP",
                        "default": os.environ.get("ENABLE_SIGNUP", "1"),
                    },
                ]
            )
        )

        provider = GithubAuthAdapter(
            request=request,
            client_id=GITHUB_CLIENT_ID,
            client_secret=GITHUB_CLIENT_SECRET,
            code=code,
        )

        user, email = provider.authenticate()

        if user:
            user = provider.complete_login_or_signup()
            login(request=request, user=user)
            return redirect(request.session.get("referer"))
        else:
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                return redirect(request.session.get("referer"))
            user = provider.complete_login_or_signup(is_signup=True)
            login(request=request, user=user)
            return redirect(request.session.get("referer"))
