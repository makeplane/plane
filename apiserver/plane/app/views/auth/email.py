# Python imports
import uuid

# Django imports
from django.contrib.auth import login, logout
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http.response import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.utils import timezone
from django.views import View

# Module imports
from plane.db.models import Profile, User


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
                {"error": "Both email and password are required"},
                status=400
            )

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return JsonResponse(
                {"error": "Please provide a valid email address."},
                status=400,
            )

        # Get the user
        user = User.objects.filter(email=email).first()

        # Existing user
        if not user:
            return JsonResponse(
                {
                    "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                },
                status=403,
            )

        # Check user password
        if not user.check_password(password):
            return JsonResponse(
                {
                    "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                },
                status=403,
            )

        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.last_login_medium = "email"
        user.save()

        login(request=request, user=user)
        return redirect(request.session.get("referer", "/"))


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
        except ValidationError as e:
            return JsonResponse(
                {"error": "Please provide a valid email address."},
                status=400,
            )

        # Check if the user already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "User with this email already exists"},
                status=400,
            )

        user = User.objects.create(email=email, username=uuid.uuid4().hex)
        user.set_password(password)

        # settings last actives for the user
        user.is_password_autoset = False
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.last_login_medium = "email"
        user.save()

        # Create profile
        _ = Profile.objects.create(user=user)

        login(request=request, user=user)
        return redirect(request.session.get("referer", "/"))


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
        return JsonResponse({'csrf_token': csrf_token})
