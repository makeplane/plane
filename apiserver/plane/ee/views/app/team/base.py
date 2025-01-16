# Python imports
import random
import json

# Django imports
from django.db.models import OuterRef, Subquery, Exists
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkspaceUserPermission
from plane.db.models import Workspace, ProjectMember
from plane.ee.models import TeamSpace, TeamSpaceProject, TeamSpaceMember
from plane.ee.serializers import TeamSpaceSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.permissions import allow_permission, ROLE
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamBaseEndpoint(BaseAPIView):
    @property
    def team_space_id(self):
        return self.kwargs.get("team_space_id")


class TeamSpaceEndpoint(TeamBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]
    model = TeamSpace
    serializer_class = TeamSpaceSerializer

    def get_team_space(self, slug, team_space_id):
        """
        Get team space by pk
        """
        return (
            TeamSpace.objects.annotate(
                project_ids=Coalesce(
                    Subquery(
                        TeamSpaceProject.objects.filter(
                            team_space=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("team_space")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .annotate(
                is_member=Exists(
                    TeamSpaceMember.objects.filter(
                        team_space=OuterRef("pk"), member_id=self.request.user.id
                    )
                )
            )
            .get(workspace__slug=slug, pk=team_space_id, is_member=True)
        )

    def get_team_spaces(self, slug):
        """
        Get all team spaces in workspace
        """
        return (
            TeamSpace.objects.filter(
                workspace__slug=slug, members__member_id=self.request.user.id
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        TeamSpaceProject.objects.filter(
                            team_space=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("team_space")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .distinct()
        )

    def get_add_remove_team_space_projects(
        self, slug, team_space_id, request_project_ids
    ):
        # Update team space projects
        existing_project_ids = [
            str(project_id)
            for project_id in TeamSpaceProject.objects.filter(
                team_space_id=team_space_id, workspace__slug=slug
            ).values_list("project_id", flat=True)
        ]

        # Get the list of project ids to be added
        project_ids_to_be_added = set(request_project_ids) - set(existing_project_ids)
        # Get the list of project ids to be removed
        project_ids_to_be_removed = set(existing_project_ids) - set(request_project_ids)

        return project_ids_to_be_added, project_ids_to_be_removed

    def add_project_members(self, project_ids):
        # Get the workspace
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))

        # Add new members
        member_ids = TeamSpaceMember.objects.filter(
            team_space_id=self.team_space_id, workspace__slug=self.kwargs.get("slug")
        ).values_list("member_id", flat=True)
        # Update project members
        ProjectMember.objects.filter(
            project_id__in=project_ids,
            workspace__slug=self.kwargs.get("slug"),
            member_id__in=member_ids,
        ).update(is_active=True)

        # Create new project members
        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project_id=project_id,
                    member_id=member_id,
                    is_active=True,
                    role=15,
                    workspace=workspace,
                )
                for project_id in project_ids
                for member_id in member_ids
            ],
            ignore_conflicts=True,
            batch_size=100,
        )
        return

    @allow_permission(
        level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST]
    )
    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id=None):
        # Get team space by pk
        if team_space_id:
            team_space = self.get_team_space(slug, team_space_id)
            serializer = TeamSpaceSerializer(team_space)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team spaces in workspace
        team_spaces = self.get_team_spaces(slug)
        serializer = TeamSpaceSerializer(team_spaces, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.TEAMS)
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            project_ids = request.data.pop("project_ids", [])

            # Create team space
            serializer = TeamSpaceSerializer(data=request.data)

            # Validate serializer
            if serializer.is_valid():
                team_space = serializer.save(workspace=workspace)

                # Add the creating user as the first member of the team space
                TeamSpaceMember.objects.create(
                    team_space=team_space,
                    workspace=workspace,
                    member_id=request.user.id,
                )

                # Add the lead to the team space if provided and not the creating user
                if request.data.get("lead_id") and str(
                    request.data.get("lead_id")
                ) != str(request.user.id):
                    TeamSpaceMember.objects.create(
                        team_space=team_space,
                        workspace=workspace,
                        member_id=request.data.get("lead_id"),
                    )

                # Create team space projects
                TeamSpaceProject.objects.bulk_create(
                    [
                        TeamSpaceProject(
                            team_space=team_space,
                            workspace=workspace,
                            project_id=project_id,
                            sort_order=random.randint(1, 65535),
                        )
                        for project_id in project_ids
                    ],
                    ignore_conflicts=True,
                    batch_size=100,
                )

                # Track the teamspace creation activity
                team_space_activity.delay(
                    type="team_space.activity.created",
                    slug=slug,
                    requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    team_space_id=str(team_space.id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                )

                # Refetch team space with project_ids
                team_space = self.get_team_space(slug, team_space.pk)

                serializer = TeamSpaceSerializer(team_space)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.TEAMS)
    def patch(self, request, slug, team_space_id):
        try:
            # Get team space by pk
            team_space = self.get_team_space(slug, team_space_id)
            # Get workspace
            workspace = Workspace.objects.get(slug=slug)

            current_instance = json.dumps(
                TeamSpaceSerializer(team_space).data, cls=DjangoJSONEncoder
            )
            requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)

            serializer = TeamSpaceSerializer(
                team_space, data=request.data, partial=True
            )
            if serializer.is_valid():
                team_space = serializer.save()

                # Get the lead id from request
                lead_id = request.data.get("lead_id", None)
                # Add the lead to the team space if provided and not the creating user
                if (
                    lead_id
                    and TeamSpaceMember.objects.filter(
                        team_space=team_space, member_id=lead_id
                    ).exists()
                    is False
                ):
                    TeamSpaceMember.objects.create(
                        team_space=team_space, workspace=workspace, member_id=lead_id
                    )

                # Get the list of project ids for request if it exists
                if "project_ids" in request.data:
                    # Get the list of project ids for request
                    project_ids = request.data.pop("project_ids", [])

                    # Update team space projects
                    project_ids_to_be_added, project_ids_to_be_removed = (
                        self.get_add_remove_team_space_projects(
                            slug, team_space.pk, project_ids
                        )
                    )

                    # Create team space projects
                    TeamSpaceProject.objects.bulk_create(
                        [
                            TeamSpaceProject(
                                team_space=team_space,
                                workspace=workspace,
                                project_id=project_id,
                                sort_order=random.randint(1, 65535),
                            )
                            for project_id in project_ids_to_be_added
                        ],
                        ignore_conflicts=True,
                        batch_size=100,
                    )
                    # Add project members
                    self.add_project_members(project_ids_to_be_added)

                    # Delete team space projects
                    TeamSpaceProject.objects.filter(
                        team_space_id=team_space.pk,
                        workspace__slug=slug,
                        project_id__in=project_ids_to_be_removed,
                    ).delete()

                team_space_activity.delay(
                    type="team_space.activity.updated",
                    slug=slug,
                    requested_data=requested_data,
                    actor_id=str(request.user.id),
                    team_space_id=str(team_space_id),
                    current_instance=current_instance,
                    epoch=int(timezone.now().timestamp()),
                )

                # Refetch team space with project_ids
                team_space = self.get_team_space(slug, team_space.pk)
                serializer = TeamSpaceSerializer(team_space)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TeamSpace.DoesNotExist:
            return Response(
                {"error": "Team space not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN])
    @check_feature_flag(FeatureFlag.TEAMS)
    def delete(self, request, slug, team_space_id):
        """
        Delete team space by pk
        """
        try:
            # The current deleting user should be part of the team space
            if not TeamSpaceMember.objects.filter(
                team_space_id=team_space_id, member_id=request.user
            ).exists():
                return Response(
                    {"error": "You are not part of the team space"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get team space by pk
            team_space = TeamSpace.objects.get(workspace__slug=slug, pk=team_space_id)

            team_space_activity.delay(
                type="team_space.activity.deleted",
                slug=slug,
                requested_data=json.dumps({"team_space_id": str(team_space_id)}),
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                current_instance={},
                epoch=int(timezone.now().timestamp()),
            )

            # Delete team space
            team_space.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TeamSpace.DoesNotExist:
            return Response(
                {"error": "Team space not found"}, status=status.HTTP_404_NOT_FOUND
            )
