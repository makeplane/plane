# Python imports
import requests

# Django imports
from django.http import HttpResponseRedirect
from django.conf import settings

# Third party imports
import boto3
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated

# Module imports
from plane.app.serializers import (
    UserSerializer,
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
    FileAssetSerializer,
)

from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.db.models import User, IssueActivity, WorkspaceMember, ProjectMember, FileAsset
from plane.license.models import Instance, InstanceAdmin
from plane.utils.paginator import BasePaginator
from plane.utils.presigned_url_generator import generate_download_presigned_url

from django.db.models import Q, F, Count, Case, When, IntegerField


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
        return Response(
            {"is_instance_admin": is_admin}, status=status.HTTP_200_OK
        )

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
                    When(
                        Q(role=20, is_active=True) & ~Q(member=request.user),
                        then=1,
                    ),
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
                    When(
                        Q(role=20, is_active=True) & ~Q(member=request.user),
                        then=1,
                    ),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            total_members=Count("id"),
        )

        for workspace in workspaces:
            if workspace.other_admin_exists > 0 or (
                workspace.total_members == 1
            ):
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
        return Response(
            {"message": "Updated successfully"}, status=status.HTTP_200_OK
        )


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_tour_completed = request.data.get("is_tour_completed", False)
        user.save()
        return Response(
            {"message": "Updated successfully"}, status=status.HTTP_200_OK
        )


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request):
        queryset = IssueActivity.objects.filter(
            actor=request.user
        ).select_related("actor", "workspace", "issue", "project")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )


class UserAvatarEndpoint(BaseAPIView):

    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def get_permissions(self):
        if self.request.method == "POST" or self.request.method == "DELETE":
            return [
                IsAuthenticated(),
            ]
        return [
            AllowAny(),
        ]


    def get(self, request, avatar_key):
        url = generate_download_presigned_url(
            key=avatar_key,
            host=request.get_host(),
            scheme=request.scheme,
        )
        return HttpResponseRedirect(url)

    def post(self, request):
        serializer = FileAssetSerializer(data=request.data)
        if serializer.is_valid():
            # Get the workspace
            serializer.save()
            user = request.user
            user.avatar = "/api/users/avatar/" + serializer.data["asset"] + "/"
            user.save()
            user_serializer = UserMeSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, avatar_key):
        file_asset = FileAsset.objects.get(asset=avatar_key)
        file_asset.is_deleted = True
        file_asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserCoverImageEndpoint(BaseAPIView):

    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def get_permissions(self):
        if self.request.method == "POST" or self.request.method == "DELETE":
            return [
                IsAuthenticated(),
            ]
        return [
            AllowAny(),
        ]

    def get(self, request, cover_image_key):
        url = generate_download_presigned_url(
            key=cover_image_key,
            host=request.get_host(),
            scheme=request.scheme,
        )
        return HttpResponseRedirect(url)

    def post(self, request):
        serializer = FileAssetSerializer(data=request.data)
        if serializer.is_valid():
            # Get the workspace
            serializer.save()
            user = request.user
            user.avatar = "/api/users/cover-image/" + serializer.data["asset"] + "/"
            user.save()
            user_serializer = UserMeSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, cover_image_key):
        file_asset = FileAsset.objects.get(asset=cover_image_key)
        file_asset.is_deleted = True
        file_asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
