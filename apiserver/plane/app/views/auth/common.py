# Python imports
from urllib.parse import urlencode

# Django imports
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.middleware.csrf import get_token
from django.views import View


class SignOutAuthEndpoint(View):

    def post(self, request):
        logout(request)
        request.session.flush()
        query_string = urlencode({"message": "User signed out successfully"})
        url = request.META.get("HTTP_REFERER", "/") + "?" + query_string
        return HttpResponseRedirect(url)


class CSRFTokenEndpoint(View):

    def get(self, request):
        # Generate a CSRF token
        csrf_token = get_token(request)
        query_string = urlencode({"csrf_token": csrf_token})
        url = request.META.get("HTTP_REFERER", "/") + "?" + query_string
        # Return the CSRF token in a JSON response
        return HttpResponseRedirect(url)
