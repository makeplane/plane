# Third party imports
from rest_framework.response import Response
from rest_framework import status


# Module imports
from plane.app.serializers import (
    UserSerializer,
    IssueActivitySerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
)

from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.db.models import User, IssueActivity, WorkspaceMember, ProjectMember
from plane.license.models import Instance, InstanceAdmin
from plane.utils.paginator import BasePaginator


from django.db.models import Q, F, Count, Case, When, Value, IntegerField


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


class SetUserPasswordEndpoint(BaseAPIView):
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
                {"error": "Password is not valid"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Set the user password
        user.set_password(password)
        user.is_password_autoset = False
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

