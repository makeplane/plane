from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.auth import logout
from django.utils import timezone
from django.db.models import F

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.app.serializers import UserMeSerializer
from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException
from plane.authentication.session import BaseSessionAuthentication
from plane.authentication.utils.host import user_ip
from plane.authentication.utils.login import user_login
from plane.db.models import User, WorkspaceMember
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value


def get_coach_auth_payload(user):
    serializer = UserMeSerializer(user)
    workspace_access = list(
        WorkspaceMember.objects.filter(member=user, is_active=True, deleted_at__isnull=True)
        .select_related("workspace")
        .order_by("workspace__name")
        .annotate(workspace_slug=F("workspace__slug"), workspace_name=F("workspace__name"))
        .values("workspace_id", "workspace_slug", "workspace_name", "role")
    )

    return {
        "is_authenticated": True,
        "user": serializer.data,
        "workspace_access": workspace_access,
    }


class CoachSignInEndpoint(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        instance = Instance.objects.first()

        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(exc.get_error_dict(), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        email = request.data.get("email", False)
        password = request.data.get("password", False)

        if not email or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["REQUIRED_EMAIL_PASSWORD_SIGN_IN"],
                error_message="REQUIRED_EMAIL_PASSWORD_SIGN_IN",
            )
            return Response(exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST)

        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL_SIGN_IN"],
                error_message="INVALID_EMAIL_SIGN_IN",
                payload={"email": str(email)},
            )
            return Response(exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST)

        (enable_email_password,) = get_configuration_value(
            [{"key": "ENABLE_EMAIL_PASSWORD", "default": "1"}]
        )

        if enable_email_password == "0":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["EMAIL_PASSWORD_AUTHENTICATION_DISABLED"],
                error_message="EMAIL_PASSWORD_AUTHENTICATION_DISABLED",
            )
            return Response(exc.get_error_dict(), status=status.HTTP_403_FORBIDDEN)

        user = User.objects.filter(email=email).first()

        if not user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
                payload={"email": str(email)},
            )
            return Response(exc.get_error_dict(), status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
                payload={"email": str(email)},
            )
            return Response(exc.get_error_dict(), status=status.HTTP_403_FORBIDDEN)

        if not user.check_password(password):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["AUTHENTICATION_FAILED_SIGN_IN"],
                error_message="AUTHENTICATION_FAILED_SIGN_IN",
                payload={"email": str(email)},
            )
            return Response(exc.get_error_dict(), status=status.HTTP_401_UNAUTHORIZED)

        user.last_login_medium = "coach"
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = user_ip(request=request)
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save(
            update_fields=[
                "last_login_medium",
                "last_active",
                "last_login_time",
                "last_login_ip",
                "last_login_uagent",
                "token_updated_at",
            ]
        )

        user_login(request=request, user=user, is_app=True)

        return Response(get_coach_auth_payload(user), status=status.HTTP_200_OK)


class CoachSessionEndpoint(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [BaseSessionAuthentication]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"is_authenticated": False}, status=status.HTTP_200_OK)

        user = User.objects.get(pk=request.user.id)
        return Response(get_coach_auth_payload(user), status=status.HTTP_200_OK)


class CoachSignOutEndpoint(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [BaseSessionAuthentication]

    def post(self, request):
        if request.user.is_authenticated:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save(update_fields=["last_logout_ip", "last_logout_time"])

        logout(request)
        return Response({"success": True}, status=status.HTTP_200_OK)
