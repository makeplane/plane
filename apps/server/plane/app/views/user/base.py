# Python imports
import uuid

# Django imports
from django.db.models import Case, Count, IntegerField, Q, When
from django.contrib.auth import logout
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.serializers import (
    AccountSerializer,
    IssueActivitySerializer,
    ProfileSerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
    UserSerializer,
)
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import (
    Account,
    IssueActivity,
    Profile,
    ProjectMember,
    User,
    WorkspaceMember,
    WorkspaceMemberInvite,
    Session,
)
from plane.license.models import Instance, InstanceAdmin
from plane.utils.paginator import BasePaginator
from plane.authentication.utils.host import user_ip
from plane.bgtasks.user_deactivation_email_task import user_deactivation_email
from plane.utils.host import base_host
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from django.views.decorators.vary import vary_on_cookie


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user

    @method_decorator(cache_control(private=True, max_age=12))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request):
        serialized_data = UserMeSerializer(request.user).data
        return Response(serialized_data, status=status.HTTP_200_OK)

    @method_decorator(cache_control(private=True, max_age=12))
    @method_decorator(vary_on_cookie)
    def retrieve_user_settings(self, request):
        serialized_data = UserMeSettingsSerializer(request.user).data
        return Response(serialized_data, status=status.HTTP_200_OK)

    def retrieve_instance_admin(self, request):
        instance = Instance.objects.first()
        is_admin = InstanceAdmin.objects.filter(
            instance=instance, user=request.user
        ).exists()
        return Response({"is_instance_admin": is_admin}, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

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

        # Delete all workspace invites
        WorkspaceMemberInvite.objects.filter(email=user.email).delete()

        # Delete all sessions
        Session.objects.filter(user_id=request.user.id).delete()

        # Profile updates
        profile = Profile.objects.get(user=user)

        # Reset onboarding
        profile.last_workspace_id = None
        profile.is_tour_completed = False
        profile.is_onboarded = False
        profile.onboarding_step = {
            "workspace_join": False,
            "profile_complete": False,
            "workspace_create": False,
            "workspace_invite": False,
        }
        profile.save()

        # Reset password
        user.is_password_autoset = True
        user.set_password(uuid.uuid4().hex)

        # Deactivate the user
        user.is_active = False
        user.last_logout_ip = user_ip(request=request)
        user.last_logout_time = timezone.now()
        user.save()

        # Send an email to the user
        user_deactivation_email.delay(base_host(request=request, is_app=True), user.id)

        # Logout the user
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSessionEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            user = User.objects.get(pk=request.user.id)
            serializer = UserMeSerializer(user)
            data = {"is_authenticated": True}
            data["user"] = serializer.data
            return Response(data, status=status.HTTP_200_OK)
        else:
            return Response({"is_authenticated": False}, status=status.HTTP_200_OK)


class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        profile = Profile.objects.get(user_id=request.user.id)
        profile.is_onboarded = request.data.get("is_onboarded", False)
        profile.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        profile = Profile.objects.get(user_id=request.user.id)
        profile.is_tour_completed = request.data.get("is_tour_completed", False)
        profile.save()
        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request):
        queryset = IssueActivity.objects.filter(actor=request.user).select_related(
            "actor", "workspace", "issue", "project"
        )

        return self.paginate(
            order_by=request.GET.get("order_by", "-created_at"),
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )


class AccountEndpoint(BaseAPIView):
    def get(self, request, pk=None):
        if pk:
            account = Account.objects.get(pk=pk, user=request.user)
            serializer = AccountSerializer(account)
            return Response(serializer.data, status=status.HTTP_200_OK)

        account = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(account, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        account = Account.objects.get(pk=pk, user=request.user)
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileEndpoint(BaseAPIView):
    @method_decorator(cache_control(private=True, max_age=12))
    @method_decorator(vary_on_cookie)
    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
