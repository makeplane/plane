# Django imports
from django.db.models import Case, Count, IntegerField, Q, When

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import (
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
    UserSerializer,
)
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import IssueActivity, ProjectMember, User, WorkspaceMember
from plane.license.models import Instance, InstanceAdmin
from plane.utils.cache import cache_response, invalidate_cache
from plane.utils.paginator import BasePaginator


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user

    @cache_response(60 * 60)
    def retrieve(self, request):
        serialized_data = UserMeSerializer(request.user).data
        return Response(
            serialized_data,
            status=status.HTTP_200_OK,
        )

    @cache_response(60 * 60)
    def retrieve_user_settings(self, request):
        serialized_data = UserMeSettingsSerializer(request.user).data
        return Response(serialized_data, status=status.HTTP_200_OK)

    @cache_response(60 * 60)
    def retrieve_instance_admin(self, request):
        instance = Instance.objects.first()
        is_admin = InstanceAdmin.objects.filter(
            instance=instance, user=request.user
        ).exists()
        return Response(
            {"is_instance_admin": is_admin}, status=status.HTTP_200_OK
        )

    @invalidate_cache(path="/api/users/me/")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @invalidate_cache(path="/api/users/me/")
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

    @invalidate_cache(path="/api/users/me/")
    def patch(self, request):
        user = User.objects.get(pk=request.user.id, is_active=True)
        user.is_onboarded = request.data.get("is_onboarded", False)
        user.save()
        return Response(
            {"message": "Updated successfully"}, status=status.HTTP_200_OK
        )


class UpdateUserTourCompletedEndpoint(BaseAPIView):

    @invalidate_cache(path="/api/users/me/")
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
