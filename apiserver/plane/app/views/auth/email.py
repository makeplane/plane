# Django imports
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http.response import JsonResponse
from django.shortcuts import redirect
from django.views import View

# Module imports
from plane.app.views.auth.adapter.base import AuthenticationException
from plane.app.views.auth.provider.credentials.email import EmailProvider


class SignInAuthEndpoint(View):

    def post(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        if not referer:
            return JsonResponse({"error": "Not a valid referer"}, status=400)
        # set the referer as session to redirect after login
        request.session["referer"] = referer

        email = request.POST.get("email", False)
        password = request.POST.get("password", False)

        ## Raise exception if any of the above are missing
        if not email or not password:
            return JsonResponse(
                {"error": "Both email and password are required"}, status=400
            )

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(
                {"error": "Please provide a valid email address."},
                status=400,
            )
        try:
            provider = EmailProvider(request=request, key=email, code=password, is_signup=False)
            user = provider.authenticate()
            login(request=request, user=user)
            return redirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            return JsonResponse({"error": str(e)}, status=400)


class SignUpAuthEndpoint(View):

    def post(self, request):

        email = request.POST.get("email", False)
        password = request.POST.get("password", False)
        ## Raise exception if any of the above are missing
        if not email or not password:
            return JsonResponse(
                {"error": "Both email and password are required"},
                status=400,
            )

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(
                {"error": "Please provide a valid email address."},
                status=400,
            )
        try:
            provider = EmailProvider(request=request, key=email, code=password, is_signup=True)
            user = provider.authenticate()
            login(request=request, user=user)
            return redirect(request.session.get("referer", "/"))
        except AuthenticationException as e:
            return JsonResponse({"error": str(e)}, status=400)
