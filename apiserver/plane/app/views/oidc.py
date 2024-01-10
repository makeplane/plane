# Python imports
from base64 import b64encode
import uuid
import requests
import os

# Django imports
from django.utils import timezone

# Third Party modules
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import (
    SocialLoginConnection,
    User,
    WorkspaceMemberInvite,
    WorkspaceMember,
    ProjectMemberInvite,
    ProjectMember,
)
from plane.bgtasks.event_tracking_task import auth_events
from .base import BaseAPIView
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value


def get_endpoint_information(issuer: str):
    """Make a GET request to the url issuer/.well-known/openid-configuration
    Get the properties of authorization_endpoint, token_endpoint, 
    userinfo_endpoint and end_session_endpoint.
    Return them in a tuple.
    If any of the endpoints are not present, raise an exception.
    If the response is not a JSON, raise an exception.
    If the response is not a valid JSON, raise an exception.
    """

    if not issuer:
        raise ValueError("The issuer has to be supplied!")
    if not isinstance(issuer, str):
        raise ValueError("The issuer has to be a string!")

    url = issuer + "/.well-known/openid-configuration"
    response = requests.get(url=url)
    data = response.json()

    authorization_endpoint = data.get("authorization_endpoint", None)
    token_endpoint = data.get("token_endpoint", None)
    userinfo_endpoint = data.get("userinfo_endpoint", None)
    end_session_endpoint = data.get("end_session_endpoint", None)

    if (
        authorization_endpoint is None
        or token_endpoint is None
        or userinfo_endpoint is None
        or end_session_endpoint is None
    ):
        raise ValueError("The response does not contain all the endpoints!")

    return (
        authorization_endpoint,
        token_endpoint,
        userinfo_endpoint,
        end_session_endpoint,
    )


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


def get_access_token(request_token: str, client_id: str) -> str:
    """Obtain the request token from OIDC Provider.
    Given the client id, client secret and request issued out by the OIDC Provider, 
    this method should give back an access token
    Parameters
    ----------
    CLIENT_ID: str
        A string representing the client id issued out by the OIDC Provider
    CLIENT_SECRET: str
        A string representing the client secret issued out by the OIDC Provider
    request_token: str
        A string representing the request token issued out by the OIDC Provider
    Throws
    ------
    ValueError:
        if CLIENT_ID or CLIENT_SECRET or request_token is empty or not a string
    Returns
    -------
    access_token: str
        A string representing the access token issued out by the OIDC Provider
    """

    if not request_token:
        raise ValueError("The request token has to be supplied!")

    (ACCESS_TOKEN_URL, CLIENT_SECRET, WEB_URL) = get_configuration_value(
        [
            {
                "key": "OIDC_URL_TOKEN",
                "default": os.environ.get("OIDC_URL_TOKEN", None),
            },
            {
                "key": "OIDC_CLIENT_SECRET",
                "default": os.environ.get("OIDC_CLIENT_SECRET", None),
            },
            {
                "key": "WEB_URL",
                "default": os.environ.get("WEB_URL", None),
            }
        ]
    )

    url = f"{ACCESS_TOKEN_URL}"
    data = {
        "grant_type": "authorization_code",
        "code": request_token,
        "redirect_uri": WEB_URL,
    }
    basic_auth = b64encode(f"{client_id}:{CLIENT_SECRET}".encode('utf-8')).decode("ascii")
    headers = {
        "accept": "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + basic_auth,
    }

    res = requests.post(url, headers=headers, data=data)
    
    data = res.json()
    print(data)
    access_token = data["access_token"]

    return access_token


def get_user_data(access_token: str) -> dict:
    """
    Obtain the user data from OIDC Provider.
    Given the access token, this method should give back the user data
    """
    if not access_token:
        raise ValueError("The request token has to be supplied!")
    if not isinstance(access_token, str):
        raise ValueError("The request token has to be a string!")

    (USERINFO_URL,) = get_configuration_value(
        [
            {
                "key": "OIDC_URL_USERINFO",
                "default": os.environ.get("OIDC_URL_USERINFO", None),
            },
        ]
    )

    access_token = "Bearer " + access_token
    headers = {"Authorization": access_token}

    response = requests.get(url=USERINFO_URL, headers=headers)

    user_data = response.json()

    return user_data


class OIDCEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Check if instance is registered or not
            instance = Instance.objects.first()
            if instance is None and not instance.is_setup_done:
                return Response(
                    {"error": "Instance is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            id_token = request.data.get("credential", False)
            client_id = request.data.get("clientId", False)
            medium = "oidc"

            OIDC_CLIENT_ID = get_configuration_value(
                [
                    {
                        "key": "OIDC_CLIENT_ID",
                        "default": os.environ.get("OIDC_CLIENT_ID"),
                    }
                ]
            )

            if not id_token:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not OIDC_CLIENT_ID:
                return Response(
                        {"error": "OpenID Connect login is not configured"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            access_token = get_access_token(id_token, client_id)
            data = get_user_data(access_token)

            email = data.get("email", None)
            if email == None:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if "@" in email:
                user = User.objects.get(email=email)
                email = data["email"]
                mobile_number = uuid.uuid4().hex
                email_verified = True
            else:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Login Case

            if not user.is_active:
                return Response(
                    {
                        "error": "Your account has been deactivated. Please contact your site administrator."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_medium = medium
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.is_email_verified = email_verified
            user.save()

            # Check if user has any accepted invites for workspace 
            # and add them to workspace
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

            SocialLoginConnection.objects.update_or_create(
                medium=medium,
                extra_data={},
                user=user,
                defaults={
                    "token_data": {"id_token": id_token},
                    "last_login_at": timezone.now(),
                },
            )

            # Send event
            auth_events.delay(
                user=user.id,
                email=email,
                user_agent=request.META.get("HTTP_USER_AGENT"),
                ip=request.META.get("REMOTE_ADDR"),
                event_name="SIGN_IN",
                medium=medium.upper(),
                first_time=False,
            )
            
            access_token, refresh_token = get_tokens_for_user(user)

            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }

            return Response(data, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            # Signup Case
            (ENABLE_SIGNUP,) = get_configuration_value(
                [
                    {
                        "key": "ENABLE_SIGNUP",
                        "default": os.environ.get("ENABLE_SIGNUP", "0"),
                    }
                ]
            )
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

            username = data.get("preferred_username", uuid.uuid4().hex)
            display_name = data.get("name", uuid.uuid4().hex)
                
            if "@" in email:
                email = data["email"]
                mobile_number = uuid.uuid4().hex
                email_verified = True
            else:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create(
                username=username,
                display_name=display_name,
                email=email,
                mobile_number=mobile_number,
                first_name=data.get("given_name", ""),
                last_name=data.get("family_name", ""),
                is_email_verified=email_verified,
                is_password_autoset=True,
            )

            user.set_password(uuid.uuid4().hex)
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_medium = medium
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
                medium=medium.upper(),
                first_time=True,
            )

            SocialLoginConnection.objects.update_or_create(
                medium=medium,
                extra_data={},
                user=user,
                defaults={
                    "token_data": {"id_token": id_token},
                    "last_login_at": timezone.now(),
                },
            )

            access_token, refresh_token = get_tokens_for_user(user)
            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }

            return Response(data, status=status.HTTP_201_CREATED)
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong. Please try again later or contact the support team."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
