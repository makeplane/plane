# Python imports
import os
import uuid
import json

# Django imports
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from sentry_sdk import capture_message

# Module imports
from . import BaseAPIView
from plane.db.models import (
    User,
    WorkspaceMemberInvite,
    WorkspaceMember,
    ProjectMemberInvite,
    ProjectMember,
)
from plane.settings.redis import redis_instance
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value
from plane.bgtasks.event_tracking_task import auth_events


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


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

        # get configuration values
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
        user.save()

        access_token, refresh_token = get_tokens_for_user(user)

        data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

        return Response(data, status=status.HTTP_200_OK)


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
        if user:
            # Check user password
            if not user.check_password(password):
                return Response(
                    {
                        "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Create the user
        else:
            (ENABLE_SIGNUP,) = get_configuration_value(
                [
                    {
                        "key": "ENABLE_SIGNUP",
                        "default": os.environ.get("ENABLE_SIGNUP"),
                    },
                ]
            )
            # Create the user
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
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(password),
                is_password_autoset=False,
            )

        # settings last active for the user
        user.is_active = True
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = request.META.get("REMOTE_ADDR")
        user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

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
                    role=project_member_invite.role
                    if project_member_invite.role in [5, 10, 15]
                    else 15,
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
                    role=project_member_invite.role
                    if project_member_invite.role in [5, 10, 15]
                    else 15,
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
        # Send event
        auth_events.delay(
            user=user.id,
            email=email,
            user_agent=request.META.get("HTTP_USER_AGENT"),
            ip=request.META.get("REMOTE_ADDR"),
            event_name="SIGN_IN",
            medium="EMAIL",
            first_time=False,
        )

        access_token, refresh_token = get_tokens_for_user(user)
        data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
        return Response(data, status=status.HTTP_200_OK)


class SignOutEndpoint(BaseAPIView):
    def post(self, request):
        refresh_token = request.data.get("refresh_token", False)

        if not refresh_token:
            capture_message("No refresh token provided")
            return Response(
                {"error": "No refresh token provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.get(pk=request.user.id)

        user.last_logout_time = timezone.now()
        user.last_logout_ip = request.META.get("REMOTE_ADDR")

        user.save()

        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "success"}, status=status.HTTP_200_OK)


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

        ri = redis_instance()

        if ri.exists(key):
            data = json.loads(ri.get(key))

            token = data["token"]
            email = data["email"]

            if str(token) == str(user_token):
                user = User.objects.get(email=email)
                # Send event
                auth_events.delay(
                    user=user.id,
                    email=email,
                    user_agent=request.META.get("HTTP_USER_AGENT"),
                    ip=request.META.get("REMOTE_ADDR"),
                    event_name="SIGN_IN",
                    medium="MAGIC_LINK",
                    first_time=False,
                )

                user.is_active = True
                user.is_email_verified = True
                user.last_active = timezone.now()
                user.last_login_time = timezone.now()
                user.last_login_ip = request.META.get("REMOTE_ADDR")
                user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
                user.token_updated_at = timezone.now()
                user.save()

                # Check if user has any accepted invites for workspace and add them to workspace
                workspace_member_invites = (
                    WorkspaceMemberInvite.objects.filter(
                        email=user.email, accepted=True
                    )
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
                            role=project_member_invite.role
                            if project_member_invite.role in [5, 10, 15]
                            else 15,
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
                            role=project_member_invite.role
                            if project_member_invite.role in [5, 10, 15]
                            else 15,
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

                access_token, refresh_token = get_tokens_for_user(user)
                data = {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }

                return Response(data, status=status.HTTP_200_OK)

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
