# Python import
import os
import requests

# Django imports
from django.utils import timezone


# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.serializers import (
    UserSerializer,
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
    ConnectedAccountSerializer,
)
from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.db.models import (
    User,
    IssueActivity,
    WorkspaceMember,
    ProjectMember,
    ConnectedAccount,
)
from plane.license.models import Instance, InstanceAdmin
from plane.utils.paginator import BasePaginator
from django.db.models import Q, F, Count, Case, When, IntegerField
from plane.license.utils.instance_value import get_configuration_value


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user

    def retrieve(self, request):
        serialized_data = UserMeSerializer(request.user).data
        return Response(
            serialized_data,
            status=status.HTTP_200_OK,
        )

    def retrieve_user_settings(self, request):
        serialized_data = UserMeSettingsSerializer(request.user).data
        return Response(serialized_data, status=status.HTTP_200_OK)

    def retrieve_instance_admin(self, request):
        instance = Instance.objects.first()
        is_admin = InstanceAdmin.objects.filter(
            instance=instance, user=request.user
        ).exists()
        return Response({"is_instance_admin": is_admin}, status=status.HTTP_200_OK)

    def deactivate(self, request):
        # Check all workspace user is active
        user = self.get_object()

        # Instance admin check
        if InstanceAdmin.objects.filter(user=user).exists():
            return Response(
                {
                    "error": "You cannot deactivate your account since you are an instance admin"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        projects_to_deactivate = []
        workspaces_to_deactivate = []

        projects = ProjectMember.objects.filter(
            member=request.user, is_active=True
        ).annotate(
            other_admin_exists=Count(
                Case(
                    When(Q(role=20, is_active=True) & ~Q(member=request.user), then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            total_members=Count("id"),
        )

        for project in projects:
            if project.other_admin_exists > 0 or (project.total_members == 1):
                project.is_active = False
                projects_to_deactivate.append(project)
            else:
                return Response(
                    {
                        "error": "You cannot deactivate account as you are the only admin in some projects."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        workspaces = WorkspaceMember.objects.filter(
            member=request.user, is_active=True
        ).annotate(
            other_admin_exists=Count(
                Case(
                    When(Q(role=20, is_active=True) & ~Q(member=request.user), then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            total_members=Count("id"),
        )

        for workspace in workspaces:
            if workspace.other_admin_exists > 0 or (workspace.total_members == 1):
                workspace.is_active = False
                workspaces_to_deactivate.append(workspace)
            else:
                return Response(
                    {
                        "error": "You cannot deactivate account as you are the only admin in some workspaces."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        ProjectMember.objects.bulk_update(
            projects_to_deactivate, ["is_active"], batch_size=100
        )

        WorkspaceMember.objects.bulk_update(
            workspaces_to_deactivate, ["is_active"], batch_size=100
        )

        # Deactivate the user
        user.is_active = False
        user.last_workspace_id = None
        user.is_tour_completed = False
        user.is_onboarded = False
        user.onboarding_step = {
            "workspace_join": False,
            "profile_complete": False,
            "workspace_create": False,
            "workspace_invite": False,
        }
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_onboarded = request.data.get("is_onboarded", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_tour_completed = request.data.get("is_tour_completed", False)
        user.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request):
        queryset = IssueActivity.objects.filter(actor=request.user).select_related(
            "actor", "workspace", "issue", "project"
        )

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )


class ConnectedAccountEndpoint(BaseAPIView):
    def get_access_token(self, request_token: str) -> str:
        """Obtain the request token from github.
        Given the client id, client secret and request issued out by GitHub, this method
        should give back an access token
        Parameters
        ----------
        CLIENT_ID: str
            A string representing the client id issued out by github
        CLIENT_SECRET: str
            A string representing the client secret issued out by github
        request_token: str
            A string representing the request token issued out by github
        Throws
        ------
        ValueError:
            if CLIENT_ID or CLIENT_SECRET or request_token is empty or not a string
        Returns
        -------
        access_token: str
            A string representing the access token issued out by github
        """

        if not request_token:
            raise ValueError("The request token has to be supplied!")

        (CLIENT_SECRET, GITHUB_CLIENT_ID) = get_configuration_value(
            [
                {
                    "key": "GITHUB_CLIENT_SECRET",
                    "default": os.environ.get("GITHUB_CLIENT_SECRET", None),
                },
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID"),
                },
            ]
        )

        url = f"https://github.com/login/oauth/access_token?client_id={str(GITHUB_CLIENT_ID)}&client_secret={str(CLIENT_SECRET)}&code={str(request_token)}"

        headers = {"accept": "application/json"}

        res = requests.post(url, headers=headers)

        data = res.json()

        return data

    def post(self, request):
        # Get the medium and temporary code
        medium = request.data.get("medium", False)
        id_token = request.data.get("credential", False)

        if medium == "github":
            account_data = self.get_access_token(id_token)
            # Get the values from the tokens
            (
                github_access_token,
                github_refresh_token,
                access_token_expired_at,
                refresh_token_expired_at,
            ) = (
                account_data.get("access_token"),
                account_data.get("refresh_token", None),
                account_data.get("expires_in", None),
                account_data.get("refresh_token_expires_in", None),
            )
            # Get the connected account
            connected_account = ConnectedAccount.objects.filter(
                user=request.user, medium=medium
            ).first()

            if access_token_expired_at:
                access_token_expired_at = timezone.now() + timezone.timedelta(
                    seconds=access_token_expired_at
                )
                refresh_token_expired_at = timezone.now() + timezone.timedelta(
                    seconds=refresh_token_expired_at
                )

            # If the connected account exists
            if connected_account:
                connected_account.access_token = github_access_token
                connected_account.refresh_token = github_refresh_token
                connected_account.access_token_expired_at = access_token_expired_at
                connected_account.refresh_token_expired_at = refresh_token_expired_at
                connected_account.last_connected_at = timezone.now()
                connected_account.save()
            else:
                # Create the connected account
                connected_account = ConnectedAccount.objects.create(
                    medium=medium,
                    user=request.user,
                    access_token=github_access_token,
                    refresh_token=github_refresh_token,
                    access_token_expired_at=access_token_expired_at,
                    refresh_token_expired_at=refresh_token_expired_at,
                    last_connected_at=timezone.now(),
                )

        serializer = ConnectedAccountSerializer(connected_account)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        connected_accounts = ConnectedAccount.objects.filter(user=request.user)
        serializer = ConnectedAccountSerializer(connected_accounts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, medium):
        connected_account = ConnectedAccount.objects.get(medium=medium, user=request.user)
        connected_account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
