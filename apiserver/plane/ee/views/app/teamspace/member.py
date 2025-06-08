# Python imports
import json

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.db.models import Q

# Module imports
from .base import TeamspaceBaseEndpoint
from plane.ee.permissions import WorkspaceUserPermission
from plane.db.models import Workspace
from plane.ee.models import Teamspace, TeamspaceMember
from plane.ee.serializers import TeamspaceMemberSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.permissions import allow_permission, ROLE
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamspaceMembersEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [WorkspaceUserPermission]
    model = TeamspaceMember
    serializer_class = TeamspaceMemberSerializer

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def get(self, request, slug, team_space_id=None, pk=None):
        # Get team space member by pk
        if pk:
            team_space_member = TeamspaceMember.objects.get(
                workspace__slug=slug, team_space_id=team_space_id, pk=pk
            )
            serializer = TeamspaceMemberSerializer(team_space_member)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team space members for a team space
        if team_space_id:
            team_space_members = TeamspaceMember.objects.filter(
                workspace__slug=slug, team_space_id=team_space_id
            )
            serializer = TeamspaceMemberSerializer(team_space_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team spaces for the use
        team_spaces = Teamspace.objects.filter(
            workspace__slug=slug, members__member_id=self.request.user.id
        )

        # Get all team space members for users team spaces
        workspace_team_space_members = TeamspaceMember.objects.filter(
            workspace__slug=slug, team_space__in=team_spaces
        )
        serializer = TeamspaceMemberSerializer(workspace_team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id):
        member_ids = request.data.get("member_ids", [])

        workspace = Workspace.objects.get(slug=slug)
        team_space = Teamspace.objects.get(workspace__slug=slug, pk=team_space_id)

        # Get the current team space members
        current_members = list(
            str(member_id)
            for member_id in TeamspaceMember.objects.filter(
                workspace__slug=slug, team_space_id=team_space_id
            ).values_list("member_id", flat=True)
        )

        current_instance = json.dumps(
            {"member_ids": current_members}, cls=DjangoJSONEncoder
        )

        # Get the list of team space members
        team_space_members = (
            TeamspaceMember.objects.filter(
                workspace__slug=slug, member_id__in=member_ids
            )
            .values("member_id", "sort_order")
            .order_by("sort_order")
        )

        # Set of newly added members
        added_members = set(member_ids) - set(current_members)

        # Set of dropped members
        dropped_members = set(current_members) - set(member_ids)

        # Remove dropped members from team
        TeamspaceMember.objects.filter(
            workspace__slug=slug,
            team_space_id=team_space_id,
            member_id__in=dropped_members,
        ).delete()

        # Create team space members
        bulk_team_space_members = []
        for member in added_members:
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
                TeamspaceMember(
                    team_space=team_space,
                    workspace=workspace,
                    member_id=member,
                    sort_order=sort_order,
                )
            )

        # Create team space members
        TeamspaceMember.objects.bulk_create(
            bulk_team_space_members, ignore_conflicts=True, batch_size=100
        )

        team_space_members = TeamspaceMember.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        )

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
        serializer = TeamspaceMemberSerializer(team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission(level="WORKSPACE", allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def delete(self, request, slug, team_space_id, pk):
        # Get team space member
        team_space_member = TeamspaceMember.objects.get(
            workspace__slug=slug, team_space_id=team_space_id, pk=pk
        )

        # Get team space
        team_space = Teamspace.objects.get(workspace__slug=slug, pk=team_space_id)

        # Check if the member to be deleted is the lead
        if team_space.lead_id == team_space_member.member_id:
            return Response(
                {"error": "Cannot delete lead from team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the team space has only one member
        if (
            TeamspaceMember.objects.filter(
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
        current_team_space_members = TeamspaceMember.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("member_id", flat=True)

        current_instance = json.dumps(
            {"member_ids": list(current_team_space_members)}, cls=DjangoJSONEncoder
        )

        # Get the list of team space members
        requested_team_space_members = list(
            TeamspaceMember.objects.filter(
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
