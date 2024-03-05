# Python imports
from urllib.parse import urlencode

# Django imports
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.encoding import (
    DjangoUnicodeDecodeError,
    smart_bytes,
    smart_str,
)
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views import View

## Third Party Imports
from rest_framework import status
from rest_framework.response import Response

## Module imports
from plane.app.serializers import (
    ChangePasswordSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)
from plane.bgtasks.forgot_password_task import forgot_password
from plane.db.models import User


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


def generate_password_token(user):
    uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
    token = PasswordResetTokenGenerator().make_token(user)

    return uidb64, token


class ForgotPasswordEndpoint(View):

    def post(self, request):
        email = request.data.get("email")

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Please enter a valid email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the user
        user = User.objects.filter(email=email).first()
        if user:
            # Get the reset token for user
            uidb64, token = generate_password_token(user=user)
            current_site = request.META.get("HTTP_ORIGIN")
            # send the forgot password email
            forgot_password.delay(
                user.first_name, user.email, uidb64, token, current_site
            )
            return Response(
                {"message": "Check your email to reset your password"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Please check the email"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResetPasswordEndpoint(View):

    def post(self, request, uidb64, token):
        try:
            # Decode the id from the uidb64
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            # check if the token is valid for the user
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response(
                    {"error": "Token is invalid"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Reset the password
            serializer = ResetPasswordSerializer(data=request.data)
            if serializer.is_valid():
                # set_password also hashes the password that the user will get
                user.set_password(serializer.data.get("new_password"))
                user.is_password_autoset = False
                user.save()

                # Log the user in
                # Generate access token for the user
                login(request=request, user=user)

                return Response(status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except DjangoUnicodeDecodeError:
            return Response(
                {"error": "token is not valid, please check the new one"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ChangePasswordEndpoint(View):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        user = User.objects.get(pk=request.user.id)
        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"error": "Old password is not correct"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # set_password also hashes the password that the user will get
            user.set_password(serializer.data.get("new_password"))
            user.is_password_autoset = False
            user.save()
            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SetUserPasswordEndpoint(View):
    def post(self, request):
        user = User.objects.get(pk=request.user.id)
        password = request.data.get("password", False)

        # If the user password is not autoset then return error
        if not user.is_password_autoset:
            return Response(
                {
                    "error": "Your password is already set please change your password from profile"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check password validation
        if not password and len(str(password)) < 8:
            return Response(
                {"error": "Password is not valid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set the user password
        user.set_password(password)
        user.is_password_autoset = False
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
