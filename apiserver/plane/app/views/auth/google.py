# Django import
from django.contrib.auth import login
from django.core.exceptions import ImproperlyConfigured
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

# Module imports
from plane.app.views.auth.provider.oauth.google import GoogleOAuthProvider


class GoogleOauthInitiateEndpoint(View):
    def get(self, request):
        referer = request.META.get("HTTP_REFERER")
        print(referer)
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)

        request.session["referer"] = referer
        try:
            provider = GoogleOAuthProvider(request=request)
            auth_url = provider.get_auth_url()
            return redirect(auth_url)
        except ImproperlyConfigured as e:
            return JsonResponse({"error": str(e)}, status=400)


class GoogleCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        if not code:
            return redirect(request.session.get("referer"))

        try:
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
            )
            user = provider.authenticate()
            login(request=request, user=user)
            print(request.session.get("referer"))
            return redirect(request.session.get("referer"))
        except ImproperlyConfigured as e:
            return JsonResponse({"error": str(e)}, status=400)
