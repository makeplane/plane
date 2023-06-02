## Python imports
import jwt

## Django imports
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import (
    smart_str,
    smart_bytes,
    DjangoUnicodeDecodeError,
)
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings

## Third Party Imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework_simplejwt.tokens import RefreshToken

from sentry_sdk import capture_exception

## Module imports
from . import BaseAPIView
from plane.api.serializers import (
    ChangePasswordSerializer,
    ResetPasswordSerializer,
)
from plane.db.models import User
from plane.bgtasks.email_verification_task import email_verification
from plane.bgtasks.forgot_password_task import forgot_password


class RequestEmailVerificationEndpoint(BaseAPIView):
    def get(self, request):
        token = RefreshToken.for_user(request.user).access_token
        current_site = settings.WEB_URL
        email_verification.delay(
            request.user.first_name, request.user.email, token, current_site
        )
        return Response(
            {"message": "Email sent successfully"}, status=status.HTTP_200_OK
        )


class VerifyEmailEndpoint(BaseAPIView):
    def get(self, request):
        token = request.GET.get("token")
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms="HS256")
            user = User.objects.get(id=payload["user_id"])

            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
            return Response(
                {"email": "Successfully activated"}, status=status.HTTP_200_OK
            )
        except jwt.ExpiredSignatureError as indentifier:
            return Response(
                {"email": "Activation expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        except jwt.exceptions.DecodeError as indentifier:
            return Response(
                {"email": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class ForgotPasswordEndpoint(BaseAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)

            current_site = settings.WEB_URL

            forgot_password.delay(
                user.first_name, user.email, uidb64, token, current_site
            )

            return Response(
                {"message": "Check your email to reset your password"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Please check the email"}, status=status.HTTP_400_BAD_REQUEST
        )


class ResetPasswordEndpoint(BaseAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        try:
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response(
                    {"error": "token is not valid, please check the new one"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            serializer = ResetPasswordSerializer(data=request.data)

            if serializer.is_valid():
                # set_password also hashes the password that the user will get
                user.set_password(serializer.data.get("new_password"))
                user.save()
                response = {
                    "status": "success",
                    "code": status.HTTP_200_OK,
                    "message": "Password updated successfully",
                }

                return Response(response)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except DjangoUnicodeDecodeError as indentifier:
            return Response(
                {"error": "token is not valid, please check the new one"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ChangePasswordEndpoint(BaseAPIView):
    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(data=request.data)

            user = User.objects.get(pk=request.user.id)
            if serializer.is_valid():
                # Check old password
                if not user.object.check_password(serializer.data.get("old_password")):
                    return Response(
                        {"old_password": ["Wrong password."]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # set_password also hashes the password that the user will get
                self.object.set_password(serializer.data.get("new_password"))
                self.object.save()
                response = {
                    "status": "success",
                    "code": status.HTTP_200_OK,
                    "message": "Password updated successfully",
                }

                return Response(response)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
