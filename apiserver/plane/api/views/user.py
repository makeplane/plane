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
            workspace = Workspace.objects.get(
                pk=request.user.last_workspace_id, workspace_member__member=request.user
            )
            workspace_invites = WorkspaceMemberInvite.objects.filter(
                email=request.user.email
            ).count()
            assigned_issues = Issue.issue_objects.filter(
                assignees__in=[request.user]
            ).count()

            serialized_data = UserSerializer(request.user).data
            serialized_data["workspace"] = {
                "last_workspace_id": request.user.last_workspace_id,
                "last_workspace_slug": workspace.slug,
                "fallback_workspace_id": request.user.last_workspace_id,
                "fallback_workspace_slug": workspace.slug,
                "invites": workspace_invites,
            }
            serialized_data.setdefault("issues", {})[
                "assigned_issues"
            ] = assigned_issues

            return Response(
                serialized_data,
                status=status.HTTP_200_OK,
            )
        except Workspace.DoesNotExist:
            # This exception will be hit even when the `last_workspace_id` is None

            workspace_invites = WorkspaceMemberInvite.objects.filter(
                email=request.user.email
            ).count()
            assigned_issues = Issue.issue_objects.filter(
                assignees__in=[request.user]
            ).count()

            fallback_workspace = (
                Workspace.objects.filter(workspace_member__member=request.user)
                .order_by("created_at")
                .first()
            )

            serialized_data = UserSerializer(request.user).data

            serialized_data["workspace"] = {
                "last_workspace_id": None,
                "last_workspace_slug": None,
                "fallback_workspace_id": fallback_workspace.id
                if fallback_workspace is not None
                else None,
                "fallback_workspace_slug": fallback_workspace.slug
                if fallback_workspace is not None
                else None,
                "invites": workspace_invites,
            }
            serialized_data.setdefault("issues", {})[
                "assigned_issues"
            ] = assigned_issues

            return Response(
                serialized_data,
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
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
            return Response(
                {"message": "Updated successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UpdateUserTourCompletedEndpoint(BaseAPIView):
    def patch(self, request):
        try:
            user = User.objects.get(pk=request.user.id)
            user.is_tour_completed = request.data.get("is_tour_completed", False)
            user.save()
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
