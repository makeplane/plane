# Third party imports
from rest_framework.response import Response
from rest_framework import status

from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    UserSerializer,
    IssueActivitySerializer,
)

from plane.api.views.base import BaseViewSet, BaseAPIView
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMemberInvite,
    Issue,
    IssueActivity,
    WorkspaceMember,
)
from plane.utils.paginator import BasePaginator


class UserEndpoint(BaseViewSet):
    serializer_class = UserSerializer
    model = User

    def get_object(self):
        return self.request.user

    def retrieve(self, request):
        try:
            workspace = Workspace.objects.get(pk=request.user.last_workspace_id)
            workspace_invites = WorkspaceMemberInvite.objects.filter(
                email=request.user.email
            ).count()
            assigned_issues = Issue.objects.filter(assignees__in=[request.user]).count()

            return Response(
                {
                    "user": UserSerializer(request.user).data,
                    "slug": workspace.slug,
                    "workspace_invites": workspace_invites,
                    "assigned_issues": assigned_issues,
                },
                status=status.HTTP_200_OK,
            )
        except Workspace.DoesNotExist:
            workspace_invites = WorkspaceMemberInvite.objects.filter(
                email=request.user.email
            ).count()
            assigned_issues = Issue.objects.filter(assignees__in=[request.user]).count()
            return Response(
                {
                    "user": UserSerializer(request.user).data,
                    "slug": None,
                    "workspace_invites": workspace_invites,
                    "assigned_issues": assigned_issues,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UpdateUserOnBoardedEndpoint(BaseAPIView):
    def patch(self, request):
        try:
            user = User.objects.get(pk=request.user.id)
            user.is_onboarded = request.data.get("is_onboarded", False)
            user.save()

            if user.last_workspace_id is not None:
                user_role = WorkspaceMember.objects.filter(
                    workspace_id=user.last_workspace_id, member=request.user.id
                ).first()
                return Response(
                    {
                        "message": "Updated successfully",
                        "role": user_role.company_role
                        if user_role is not None
                        else None,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"message": "Updated successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserActivityEndpoint(BaseAPIView, BasePaginator):
    def get(self, request):
        try:
            queryset = IssueActivity.objects.filter(actor=request.user).select_related(
                "actor", "workspace"
            )

            return self.paginate(
                request=request,
                queryset=queryset,
                on_results=lambda issue_activities: IssueActivitySerializer(
                    issue_activities, many=True
                ).data,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
