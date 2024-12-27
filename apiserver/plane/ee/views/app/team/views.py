# Python imports
import random
import json

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.db import transaction
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Module imports
from plane.db.models import IssueView, Workspace, UserFavorite
from plane.ee.models import TeamSpaceView, TeamSpaceProject, TeamSpaceMember
from .base import TeamBaseEndpoint
from plane.ee.permissions import TeamSpacePermission
from plane.ee.serializers import TeamSpaceViewSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamSpaceViewEndpoint(TeamBaseEndpoint):

    model = TeamSpaceView
    permission_classes = [
        TeamSpacePermission,
    ]

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id, pk=None):
        # Check if the view is part of the team
        if pk:
            subquery = UserFavorite.objects.filter(
                user=self.request.user,
                entity_identifier=OuterRef("pk"),
                entity_type="view",
                workspace__slug=self.kwargs.get("slug"),
            )
            # Get the view
            issue_view = (
                IssueView.objects.filter(pk=pk, workspace__slug=slug)
                .annotate(is_favorite=Exists(subquery))
                .annotate(
                    is_team_view=Exists(
                        TeamSpaceView.objects.filter(
                            view_id=OuterRef("pk"), team_space_id=team_space_id
                        )
                    )
                )
                .annotate(
                    team=TeamSpaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    ).values("team_space_id")
                )
                .first()
            )
            if not issue_view:
                return Response(
                    {"error": "View not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = TeamSpaceViewSerializer(issue_view)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all the views of the team space
        scope = request.GET.get("scope", "teams")
        # Check if the user has access to the workspace
        if scope == "projects":
            project_ids = TeamSpaceProject.objects.filter(
                team_space_id=team_space_id
            ).values_list("project_id", flat=True)
            issue_views = (
                IssueView.objects.filter(
                    workspace__slug=slug, project_id__in=project_ids, access=1
                )
                .annotate(
                    is_favorite=Exists(
                        UserFavorite.objects.filter(
                            user=self.request.user,
                            entity_identifier=OuterRef("pk"),
                            entity_type="view",
                            workspace__slug=self.kwargs.get("slug"),
                        )
                    )
                )
                .annotate(
                    is_team_view=Exists(
                        TeamSpaceView.objects.filter(
                            view_id=OuterRef("pk"), team_space_id=team_space_id
                        )
                    )
                )
                .annotate(
                    team=TeamSpaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    ).values("team_space_id")
                )
            )
            serializer = TeamSpaceViewSerializer(issue_views, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all the public views of the team members for the projects
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)
        member_ids = TeamSpaceMember.objects.filter(
            team_space_id=team_space_id
        ).values_list("member_id", flat=True)

        # Get all the views that are part of the team space
        team_space_views = TeamSpaceView.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("view_id", flat=True)
        team_issue_views = (
            IssueView.objects.filter(
                Q(
                    Q(pk__in=team_space_views)
                    | Q(
                        project_id__in=project_ids, access=1, owned_by_id__in=member_ids
                    )
                ),
                workspace__slug=slug,
            )
            .annotate(
                is_team_view=Exists(
                    TeamSpaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    )
                )
            )
            .annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=self.request.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="view",
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(
                team=TeamSpaceView.objects.filter(
                    view_id=OuterRef("pk"), team_space_id=team_space_id
                ).values("team_space_id")
            )
        )
        # Combine the views
        serializer = TeamSpaceViewSerializer(team_issue_views, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMS)
    def post(self, request, slug, team_space_id):
        serializer = TeamSpaceViewSerializer(data=request.data)
        workspace = Workspace.objects.get(slug=slug)
        if serializer.is_valid():
            issue_view = serializer.save(workspace=workspace, owned_by=request.user)
            # Attach the view to the team space
            TeamSpaceView.objects.create(
                workspace=workspace,
                team_space_id=team_space_id,
                view_id=issue_view.id,
                sort_order=random.randint(0, 65535),
            )

            # Capture the team space activity
            team_space_activity.delay(
                type="view.activity.created",
                slug=slug,
                current_instance={},
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                requested_data=json.dumps(
                    {"name": str(issue_view.name), "id": str(issue_view.id)},
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
            )

            # Get issue view details
            subquery = UserFavorite.objects.filter(
                user=self.request.user,
                entity_identifier=OuterRef("pk"),
                entity_type="view",
                workspace__slug=self.kwargs.get("slug"),
            )
            # Get the view
            issue_view = (
                IssueView.objects.filter(
                    pk=serializer.data.get("id"), workspace__slug=slug
                )
                .annotate(is_favorite=Exists(subquery))
                .annotate(
                    is_team_view=Exists(
                        TeamSpaceView.objects.filter(
                            view_id=OuterRef("pk"), team_space_id=team_space_id
                        )
                    )
                )
                .annotate(
                    team=TeamSpaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    ).values("team_space_id")
                )
                .first()
            )
            serializer = TeamSpaceViewSerializer(issue_view)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMS)
    def patch(self, request, slug, team_space_id, pk):
        # Check if the view is part of the team
        if not TeamSpaceView.objects.filter(
            view_id=pk, team_space_id=team_space_id
        ).exists():
            return Response(
                {"error": "View does not belong to the team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(
                pk=pk,
                workspace__slug=slug,
            )

            # Check if the view is locked
            if issue_view.is_locked:
                return Response(
                    {"error": "view is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only update the view if owner is updating
            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {
                        "error": "Only the owner of the view can update the view"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update the view
            serializer = TeamSpaceViewSerializer(
                issue_view, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    @check_feature_flag(FeatureFlag.TEAMS)
    def delete(self, request, slug, team_space_id, pk):
        # Check if the views if of the team or project
        team_space_view = TeamSpaceView.objects.filter(
            view_id=pk, team_space_id=team_space_id
        ).first()
        if team_space_view:
            issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug)
            issue_view_details = issue_view.get()
            issue_view.delete()
            team_space_view.delete()

            # Capture the team space activity
            team_space_activity.delay(
                type="view.activity.deleted",
                slug=slug,
                requested_data={},
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                current_instance={
                    "name": str(issue_view_details.name),
                    "id": str(issue_view_details.id),
                },
                epoch=int(timezone.now().timestamp()),
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "View does not belong to the team"},
            status=status.HTTP_400_BAD_REQUEST,
        )
