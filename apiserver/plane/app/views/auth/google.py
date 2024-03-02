# Python imports
import os

# Django import
from django.contrib.auth import login
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

# Module imports
from plane.app.views.auth.adapter.google_adapter import GoogleAuthAdapter
from plane.db.models import User, WorkspaceMemberInvite
from plane.license.utils.instance_value import get_configuration_value


class GoogleOauthInitiateEndpoint(View):

    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)
        # set the referer as session to redirect after login
        request.session["referer"] = referer
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
        provider = GoogleAuthAdapter(
            client_id=GOOGLE_CLIENT_ID,
            request=request,
        )
        auth_url = provider.get_auth_url()
        return redirect(auth_url)


class GoogleCallbackEndpoint(View):

    def get(self, request):
        # The user is redirected here by Google with a code
        code = request.GET.get("code")
        if code:
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
            provider = GoogleAuthAdapter(
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET,
                request=request,
                code=code,
            )
            email = provider.validate_user()
            # check user
            user = User.objects.filter(
                email=email
            ).exists()

            if user:
                user = provider.complete_login()
                login(request=request, user=user)
                return redirect(request.session["referer"])
            else:
                if (
                    ENABLE_SIGNUP == "0"
                    and not WorkspaceMemberInvite.objects.filter(
                        email=email,
                    ).exists()
                ):
                    return redirect(request.session["referer"])
                user = provider.complete_signup()
                login(request=request, user=user)
                return redirect(request.session.get("referer"))
        return redirect(request.session.get("referer"))
