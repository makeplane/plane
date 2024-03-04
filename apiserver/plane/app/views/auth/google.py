# Python imports
from urllib.parse import urlencode

# Django import
from django.contrib.auth import login
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.app.views.auth.provider.oauth.google import GoogleOAuthProvider


class GoogleOauthInitiateEndpoint(View):
    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        request.session["referer"] = referer
        try:
            provider = GoogleOAuthProvider(request=request)
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except ImproperlyConfigured as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)


class GoogleCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        referer = request.session.get("referer")
        if not code:
            url = (
                referer
                + "?"
                + urlencode(
                    {
                        "error": "Something went wrong while fetching data from OAuth provider. Please try again after sometime."
                    }
                )
            )
            return HttpResponseRedirect(url)

        try:
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
            )
            user = provider.authenticate()
            login(request=request, user=user)
            return HttpResponseRedirect(request.session.get("referer"))
        except ImproperlyConfigured as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
