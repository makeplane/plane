# Python imports
import random
import json

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.db import transaction
from django.db.models import Exists, OuterRef
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Module imports
from plane.db.models import IssueView, Workspace, UserFavorite
from plane.ee.models import TeamspaceView
from .base import TeamspaceBaseEndpoint
from plane.ee.permissions import TeamspacePermission
from plane.ee.serializers import TeamspaceViewSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamspaceViewEndpoint(TeamspaceBaseEndpoint):
    model = TeamspaceView
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
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
                    team=TeamspaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    ).values("team_space_id")
                )
                .first()
            )
            if not issue_view:
                return Response(
                    {"error": "View not found"}, status=status.HTTP_404_NOT_FOUND
                )
            serializer = TeamspaceViewSerializer(issue_view)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all the views that are part of the team space
        team_space_views = TeamspaceView.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("view_id", flat=True)
        team_issue_views = (
            IssueView.objects.filter(pk__in=team_space_views, workspace__slug=slug)
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
                team=TeamspaceView.objects.filter(
                    view_id=OuterRef("pk"), team_space_id=team_space_id
                ).values("team_space_id")
            )
        )
        serializer = TeamspaceViewSerializer(team_issue_views, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id):
        serializer = TeamspaceViewSerializer(data=request.data)
        workspace = Workspace.objects.get(slug=slug)
        if serializer.is_valid():
            issue_view = serializer.save(workspace=workspace, owned_by=request.user)
            # Attach the view to the team space
            TeamspaceView.objects.create(
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
                    team=TeamspaceView.objects.filter(
                        view_id=OuterRef("pk"), team_space_id=team_space_id
                    ).values("team_space_id")
                )
                .first()
            )
            serializer = TeamspaceViewSerializer(issue_view)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def patch(self, request, slug, team_space_id, pk):
        # Check if the view is part of the team
        if not TeamspaceView.objects.filter(
            view_id=pk, team_space_id=team_space_id
        ).exists():
            return Response(
                {"error": "View does not belong to the team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(
                pk=pk, workspace__slug=slug
            )

            # Check if the view is locked
            if issue_view.is_locked:
                return Response(
                    {"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Only update the view if owner is updating
            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {"error": "Only the owner of the view can update the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update the view
            serializer = TeamspaceViewSerializer(
                issue_view, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def delete(self, request, slug, team_space_id, pk):
        # Check if the views if of the team or project
        team_space_view = TeamspaceView.objects.filter(
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
