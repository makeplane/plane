# Django imports
from django.contrib.auth import logout
from django.http.response import JsonResponse
from django.middleware.csrf import get_token
from django.views import View


class SignOutAuthEndpoint(View):

    def post(self, request):
        logout(request)
        request.session.flush()
        return JsonResponse({"message": "User signed out successfully"})


class CSRFTokenEndpoint(View):

    def get(self, request):
        # Generate a CSRF token
        csrf_token = get_token(request)

        # Return the CSRF token in a JSON response
        return JsonResponse({"csrf_token": csrf_token})
