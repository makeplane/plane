# Python imports
import os
import uuid
import json
from datetime import datetime
import pytz
import random
import string

# Django imports
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.auth import logout
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

# Module imports
from . import BaseAPIView
from plane.app.serializers import UserMeSerializer
from plane.db.models import (
    User,
    WorkspaceMemberInvite,
    WorkspaceMember,
    ProjectMemberInvite,
    ProjectMember,
    Account,
    Profile,
)
from plane.settings.redis import redis_instance
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value
from plane.bgtasks.event_tracking_task import auth_events
from plane.bgtasks.magic_link_code_task import magic_link


def process_workspace_project_invitations(user):
    """This function takes in User and adds him to all workspace and projects that the user has accepted invited of"""

    # Check if user has any accepted invites for workspace and add them to workspace
    workspace_member_invites = WorkspaceMemberInvite.objects.filter(
        email=user.email, accepted=True
    )

    WorkspaceMember.objects.bulk_create(
        [
            WorkspaceMember(
                workspace_id=workspace_member_invite.workspace_id,
                member=user,
                role=workspace_member_invite.role,
            )
            for workspace_member_invite in workspace_member_invites
        ],
        ignore_conflicts=True,
    )

    # Check if user has any project invites
    project_member_invites = ProjectMemberInvite.objects.filter(
        email=user.email, accepted=True
    )

    # Add user to workspace
    WorkspaceMember.objects.bulk_create(
        [
            WorkspaceMember(
                workspace_id=project_member_invite.workspace_id,
                role=(
                    project_member_invite.role
                    if project_member_invite.role in [5, 10, 15]
                    else 15
                ),
                member=user,
                created_by_id=project_member_invite.created_by_id,
            )
            for project_member_invite in project_member_invites
        ],
        ignore_conflicts=True,
    )

    # Now add the users to project
    ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                workspace_id=project_member_invite.workspace_id,
                role=(
                    project_member_invite.role
                    if project_member_invite.role in [5, 10, 15]
                    else 15
                ),
                member=user,
                created_by_id=project_member_invite.created_by_id,
            )
            for project_member_invite in project_member_invites
        ],
        ignore_conflicts=True,
    )

    # Delete all the invites
    workspace_member_invites.delete()
    project_member_invites.delete()


class SignUpEndpoint(BaseAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        password = request.data.get("password", False)
        ## Raise exception if any of the above are missing
        if not email or not password:
            return Response(
                {"error": "Both email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get configuration values
        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )

        # If the sign up is not enabled and the user does not have invite disallow him from creating the account
        if (
            ENABLE_SIGNUP == "0"
            and not WorkspaceMemberInvite.objects.filter(
                email=email,
            ).exists()
        ):
            return Response(
                {
                    "error": "New account creation is disabled. Please contact your site administrator"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
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

        # Add user to workspace and project
        process_workspace_project_invitations(user=user)

        # Send event
        auth_events.delay(
            user=user.id,
            email=email,
            user_agent=request.META.get("HTTP_USER_AGENT"),
            ip=request.META.get("REMOTE_ADDR"),
            event_name="Sign in",
            medium="Email",
            first_time=True,
        )

        serializer = UserMeSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SignInEndpoint(BaseAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        password = request.data.get("password", False)

        ## Raise exception if any of the above are missing
        if not email or not password:
            return Response(
                {"error": "Both email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the user
        user = User.objects.filter(email=email).first()

        # Existing user
        if not user:
            return Response(
                {
                    "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check user password
        if not user.check_password(password):
            return Response(
                {
                    "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                },
                status=status.HTTP_403_FORBIDDEN,
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

        # Add user to workspace and project
        process_workspace_project_invitations(user=user)

        # Send event
        auth_events.delay(
            user=user.id,
            email=email,
            user_agent=request.META.get("HTTP_USER_AGENT"),
            ip=request.META.get("REMOTE_ADDR"),
            event_name="Sign in",
            medium="Email",
            first_time=False,
        )

        serializer = UserMeSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SignOutEndpoint(BaseAPIView):
    def post(self, request):
        logout(request=request)
        return Response({"message": "success"}, status=status.HTTP_200_OK)


class MagicGenerateEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        email = request.data.get("email", False)

        # Check the instance registration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all the configuration
        (
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
        ) = get_configuration_value(
            [
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", None),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", None),
                },
            ]
        )

        if not (bool(EMAIL_HOST_USER) and bool(EMAIL_HOST_PASSWORD)):
            return Response(
                {
                    "error": "SMTP credentials are not configured for the instance."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email:
            return Response(
                {"error": "Please provide a valid email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clean up the email
        email = email.strip().lower()
        validate_email(email)

        # check if the email exists not
        if not User.objects.filter(email=email).exists():
            # Create a user
            _ = User.objects.create(
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

        ## Generate a random token
        token = (
            "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
        )

        ri = redis_instance()

        key = "magic_" + str(email)

        # Check if the key already exists in python
        if ri.exists(key):
            data = json.loads(ri.get(key))

            current_attempt = data["current_attempt"] + 1

            if data["current_attempt"] > 2:
                return Response(
                    {
                        "error": "Max attempts exhausted. Please try again later."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            value = {
                "current_attempt": current_attempt,
                "email": email,
                "token": token,
            }
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        else:
            value = {"current_attempt": 0, "email": email, "token": token}
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        # If the smtp is configured send through here
        current_site = request.META.get("HTTP_ORIGIN")
        magic_link.delay(email, key, token, current_site)

        return Response({"key": key}, status=status.HTTP_200_OK)


class MagicSignInEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_token = request.data.get("token", "").strip()
        key = request.data.get("key", "").strip().lower()

        if not key or user_token == "":
            return Response(
                {"error": "User token and key are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )
        ri = redis_instance()

        if ri.exists(key):
            data = json.loads(ri.get(key))

            token = data["token"]
            email = data["email"]

            if str(token) == str(user_token):
                user = User.objects.filter(email=email).first()
                # Signin
                if user:
                    # Send event
                    auth_events.delay(
                        user=user.id,
                        email=email,
                        user_agent=request.META.get("HTTP_USER_AGENT"),
                        ip=request.META.get("REMOTE_ADDR"),
                        event_name="Sign in",
                        medium="Magic link",
                        first_time=False,
                    )

                    user.is_active = True
                    user.is_email_verified = True
                    user.last_active = timezone.now()
                    user.last_login_time = timezone.now()
                    user.last_login_ip = request.META.get("REMOTE_ADDR")
                    user.last_login_uagent = request.META.get(
                        "HTTP_USER_AGENT"
                    )
                    user.token_updated_at = timezone.now()
                    user.save()

                    # Add user to workspace and project
                    process_workspace_project_invitations(user=user)

                    serializer = UserMeSerializer(user)
                    return Response(serializer.data, status=status.HTTP_200_OK)

                # Signup
                else:
                    # Check if signup is enabled or not
                    if (
                        ENABLE_SIGNUP == "0"
                        and not WorkspaceMemberInvite.objects.filter(
                            email=email,
                        ).exists()
                    ):
                        return Response(
                            {
                                "error": "New account creation is disabled. Please contact your site administrator"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    user = User.objects.create(
                        email=email, username=uuid.uuid4().hex
                    )
                    user.set_password(uuid.uuid4().hex)
                    # settings last actives for the user
                    user.is_password_autoset = False
                    user.last_active = timezone.now()
                    user.last_login_time = timezone.now()
                    user.last_login_ip = request.META.get("REMOTE_ADDR")
                    user.last_login_uagent = request.META.get(
                        "HTTP_USER_AGENT"
                    )
                    user.token_updated_at = timezone.now()
                    user.last_login_medium = "email"
                    user.save()

                    # Send event
                    auth_events.delay(
                        user=user.id,
                        email=email,
                        user_agent=request.META.get("HTTP_USER_AGENT"),
                        ip=request.META.get("REMOTE_ADDR"),
                        event_name="Sign in",
                        medium="Magic link",
                        first_time=True,
                    )

                    # Create profile
                    _ = Profile.objects.create(user=user)

                    # Add user to workspace and project
                    process_workspace_project_invitations(user=user)

                    serializer = UserMeSerializer(user)
                    return Response(serializer.data, status=status.HTTP_200_OK)

            else:
                return Response(
                    {
                        "error": "Your login code was incorrect. Please try again."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"error": "The magic code/link has expired please try again"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GoogleAuthEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        # Check email
        if not email:
            return Response({"error": "email is requrired"})

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter the user
        user = User.objects.filter(email=email).first()

        # Get configuration values
        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )

        # Sign In
        if user:
            # Get or create the user account
            account, created = Account.objects.get_or_create(
                user=user,
                provider="google",
                defaults={
                    "provider_account_id": request.data.get(
                        "provider_account_id"
                    ),
                    "access_token": request.data.get("access_token"),
                    "refresh_token": request.data.get("refresh_token", None),
                    "access_token_expired_at": (
                        datetime.fromtimestamp(
                            request.data.get("access_token_expired_at"),
                            tz=pytz.utc,
                        )
                        if request.data.get("access_token_expired_at")
                        else None
                    ),
                    "refresh_token_expired_at": (
                        datetime.fromtimestamp(
                            request.data.get("refresh_token_expired_at"),
                            tz=pytz.utc,
                        )
                        if request.data.get("refresh_token_expired_at")
                        else None
                    ),
                },
            )
            if not created:
                # account access and refresh token
                account.access_token = request.data.get("access_token")
                account.access_token_expired_at = (
                    datetime.fromtimestamp(
                        request.data.get("access_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("access_token_expired_at")
                    else None
                )
                account.metadata = request.data.get("metadata", {})

            # last connected at
            account.last_connected_at = timezone.now()
            account.save()

            # Update user creds
            user.last_login_medium = "google"
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            # Add user to workspace and project
            process_workspace_project_invitations(user=user)

            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Sign Up
        else:
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                return Response(
                    {
                        "error": "New account creation is disabled. Please contact your site administrator"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create(email=email, username=uuid.uuid4().hex)
            user.set_password(uuid.uuid4().hex)
            # Create profile
            _ = Profile.objects.create(user=user)

            account = Account.objects.create(
                user=user,
                provider="google",
                provider_account_id=request.data.get("provider_account_id"),
                access_token=request.data.get("access_token"),
                access_token_expired_at=(
                    datetime.fromtimestamp(
                        request.data.get("access_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("access_token_expired_at")
                    else None
                ),
                refresh_token=request.data.get("refresh_token", None),
                refresh_token_expired_at=(
                    datetime.fromtimestamp(
                        request.data.get("refresh_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("refresh_token_expired_at")
                    else None
                ),
                metadata=request.data.get("metadata", {}),
            )
            # User
            user.last_login_medium = "google"
            user.avatar = request.data.get("avatar")
            user.first_name = request.data.get("first_name")
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            # Add user to workspace and project
            process_workspace_project_invitations(user=user)

            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)


class GithubAuthEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        # Check email
        if not email:
            return Response({"error": "email is requrired"})

        # Validate email
        email = email.strip().lower()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter the user
        user = User.objects.filter(email=email).first()

        # Get configuration values
        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )

        # Sign In
        if user:
            # Get or create the user account
            account, created = Account.objects.get_or_create(
                user=user,
                provider="github",
                defaults={
                    "provider_account_id": request.data.get(
                        "provider_account_id"
                    ),
                    "access_token": request.data.get("access_token"),
                    "refresh_token": request.data.get("refresh_token", None),
                    "access_token_expired_at": (
                        datetime.fromtimestamp(
                            request.data.get("access_token_expired_at"),
                            tz=pytz.utc,
                        )
                        if request.data.get("access_token_expired_at")
                        else None
                    ),
                    "refresh_token_expired_at": (
                        datetime.fromtimestamp(
                            request.data.get("refresh_token_expired_at"),
                            tz=pytz.utc,
                        )
                        if request.data.get("refresh_token_expired_at")
                        else None
                    ),
                },
            )
            if not created:
                # account access and refresh token
                account.access_token = request.data.get("access_token")
                account.access_token_expired_at = (
                    datetime.fromtimestamp(
                        request.data.get("access_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("access_token_expired_at")
                    else None
                )
                account.metadata = request.data.get("metadata", {})

            # last connected at
            account.last_connected_at = timezone.now()
            account.save()

            # Update user creds
            user.last_login_medium = "github"
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            # Add user to workspace and project
            process_workspace_project_invitations(user=user)

            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Sign Up
        else:

            # Only allow if signup is enabled
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                return Response(
                    {
                        "error": "New account creation is disabled. Please contact your site administrator"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create(email=email, username=uuid.uuid4().hex)
            user.set_password(uuid.uuid4().hex)
            # Create profile
            _ = Profile.objects.create(user=user)

            account = Account.objects.create(
                user=user,
                provider="github",
                provider_account_id=request.data.get("provider_account_id"),
                access_token=request.data.get("access_token"),
                access_token_expired_at=(
                    datetime.fromtimestamp(
                        request.data.get("access_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("access_token_expired_at")
                    else None
                ),
                refresh_token=request.data.get("refresh_token", None),
                refresh_token_expired_at=(
                    datetime.fromtimestamp(
                        request.data.get("refresh_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if request.data.get("refresh_token_expired_at")
                    else None
                ),
                metadata=request.data.get("metadata", {}),
            )

            # User
            user.last_login_medium = "github"
            user.avatar = request.data.get("avatar")
            user.first_name = request.data.get("first_name")
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            # Add user to workspace and project
            process_workspace_project_invitations(user=user)

            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
