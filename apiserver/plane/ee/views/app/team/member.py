# Python imports
import json

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.db.models import Q, Case, When, Value, PositiveSmallIntegerField

# Module imports
from .base import TeamBaseEndpoint
from plane.ee.permissions import WorkspaceUserPermission
from plane.db.models import Workspace, ProjectMember
from plane.ee.models import TeamSpace, TeamSpaceMember, TeamSpaceProject
from plane.ee.serializers import TeamSpaceMemberSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.permissions import allow_permission, ROLE
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamSpaceMembersEndpoint(TeamBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]
    model = TeamSpaceMember
    serializer_class = TeamSpaceMemberSerializer

    def add_project_members(self, member_ids):
        # Get the workspace
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))

        # Add new members
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=self.team_space_id, workspace__slug=self.kwargs.get("slug")
        ).values_list("project_id", flat=True)
        # Update project members
        ProjectMember.objects.filter(
            project_id__in=project_ids,
            workspace__slug=self.kwargs.get("slug"),
            member_id__in=member_ids,
        ).update(
            is_active=True,
            role=Case(
                When(role=5, then=Value(15)),
                default="role",
                output_field=PositiveSmallIntegerField(),
            ),
        )

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

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id=None, pk=None):
        # Get team space member by pk
        if pk:
            team_space_member = TeamSpaceMember.objects.get(
                workspace__slug=slug, team_space_id=team_space_id, pk=pk
            )
            serializer = TeamSpaceMemberSerializer(team_space_member)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team space members for a team space
        if team_space_id:
            team_space_members = TeamSpaceMember.objects.filter(
                workspace__slug=slug, team_space_id=team_space_id
            )
            serializer = TeamSpaceMemberSerializer(team_space_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team spaces for the use
        team_spaces = TeamSpace.objects.filter(
            workspace__slug=slug, members__member_id=self.request.user.id
        )

        # Get all team space members for users team spaces
        workspace_team_space_members = TeamSpaceMember.objects.filter(
            workspace__slug=slug, team_space__in=team_spaces
        )
        serializer = TeamSpaceMemberSerializer(workspace_team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.TEAMS)
    def post(self, request, slug, team_space_id):
        member_ids = request.data.get("member_ids", [])

        workspace = Workspace.objects.get(slug=slug)
        team_space = TeamSpace.objects.get(workspace__slug=slug, pk=team_space_id)

        # Get the current team space members
        current_team_space_members = list(
            TeamSpaceMember.objects.filter(
                workspace__slug=slug, team_space_id=team_space_id
            ).values_list("member_id", flat=True)
        )
        current_instance = json.dumps(
            {"member_ids": current_team_space_members}, cls=DjangoJSONEncoder
        )

        # Get the list of team space members
        team_space_members = (
            TeamSpaceMember.objects.filter(
                workspace__slug=slug, member_id__in=member_ids
            )
            .values("member_id", "sort_order")
            .order_by("sort_order")
        )

        # Create team space members
        bulk_team_space_members = []
        for member in member_ids:
            sort_order = next(
                (
                    member.get("sort_order")
                    for member in team_space_members
                    if str(member.get("member_id")) == str(member)
                ),
                65535,
            )

            # Create a new team space member
            bulk_team_space_members.append(
                TeamSpaceMember(
                    team_space=team_space,
                    workspace=workspace,
                    member_id=member,
                    sort_order=sort_order,
                )
            )

        # Create team space members
        TeamSpaceMember.objects.bulk_create(
            bulk_team_space_members, ignore_conflicts=True, batch_size=100
        )

        # Add project members
        self.add_project_members(member_ids)

        team_space_members = TeamSpaceMember.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        )

        # add current members also to requested data to make it consistent
        request.data["member_ids"] = [
            str(mem) for mem in current_team_space_members
        ] + request.data.get("member_ids", [])

        # Create activity
        team_space_activity.delay(
            type="team_space.activity.updated",
            slug=slug,
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            team_space_id=str(team_space.id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        serializer = TeamSpaceMemberSerializer(team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.TEAMS)
    def delete(self, request, slug, team_space_id, pk):
        # Get team space member
        team_space_member = TeamSpaceMember.objects.get(
            workspace__slug=slug, team_space_id=team_space_id, pk=pk
        )

        # Get team space
        team_space = TeamSpace.objects.get(workspace__slug=slug, pk=team_space_id)

        # Check if the member to be deleted is the lead
        if team_space.lead_id == team_space_member.member_id:
            return Response(
                {"error": "Cannot delete lead from team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the team space has only one member
        if (
            TeamSpaceMember.objects.filter(
                workspace__slug=slug, team_space_id=team_space_id
            ).count()
            == 1
        ):
            return Response(
                {
                    "error": "Cannot delete the last member from team. Delete the team instead."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the current team space members
        current_team_space_members = TeamSpaceMember.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("member_id", flat=True)

        current_instance = json.dumps(
            {"member_ids": list(current_team_space_members)}, cls=DjangoJSONEncoder
        )

        # Get the list of team space members
        requested_team_space_members = list(
            TeamSpaceMember.objects.filter(
                ~Q(pk=pk), workspace__slug=slug, team_space_id=team_space_id
            ).values_list("member_id", flat=True)
        )

        requested_data = json.dumps(
            {"member_ids": requested_team_space_members}, cls=DjangoJSONEncoder
        )

        # Create activity
        team_space_activity.delay(
            type="team_space.activity.updated",
            slug=slug,
            requested_data=requested_data,
            actor_id=str(request.user.id),
            team_space_id=str(team_space.id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )

        # Delete team space member
        team_space_member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
