# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

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
from plane.db.models import Workspace, WorkspaceMember
from plane.ee.models import Teamspace, TeamspaceMember
from plane.ee.serializers import TeamspaceMemberSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, TeamspacePermissions
from plane.ee.bgtasks.team_space_activities_task import team_space_activity


class TeamspaceMembersEndpoint(TeamspaceBaseEndpoint):
    use_read_replica = True

    # No `model` attr: @can passes view.model to the lead-condition evaluator,
    # which reads `lead_id` — that lives on Teamspace, not TeamspaceMember.
    serializer_class = TeamspaceMemberSerializer

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.BROWSE, resource_param="workspace_id")
    def get(self, request, slug, team_space_id=None, pk=None):
        # Get team space member by pk
        if pk:
            team_space_member = TeamspaceMember.objects.get(workspace__slug=slug, team_space_id=team_space_id, pk=pk)
            serializer = TeamspaceMemberSerializer(team_space_member)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team space members for a team space
        if team_space_id:
            team_space_members = TeamspaceMember.objects.filter(workspace__slug=slug, team_space_id=team_space_id)
            serializer = TeamspaceMemberSerializer(team_space_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all team spaces for the use
        team_spaces = Teamspace.objects.filter(workspace__slug=slug, members__member_id=self.request.user.id)

        # Get all team space members for users team spaces
        workspace_team_space_members = TeamspaceMember.objects.filter(workspace__slug=slug, team_space__in=team_spaces)
        serializer = TeamspaceMemberSerializer(workspace_team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.MANAGE, resource_param="team_space_id")
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

        current_instance = json.dumps({"member_ids": current_members}, cls=DjangoJSONEncoder)

        # Get the list of team space members
        team_space_members = (
            TeamspaceMember.objects.filter(workspace__slug=slug, member_id__in=member_ids)
            .values("member_id", "sort_order")
            .order_by("sort_order")
        )

        # Set of newly added members
        added_members = set(member_ids) - set(current_members)

        # Only include active, non-guest workspace members.
        # Excludes guests via role_ref FK or legacy numeric role (5 = guest).
        eligible_member_ids = set(
            str(mid) for mid in WorkspaceMember.objects.filter(
                workspace=workspace,
                member_id__in=added_members,
                is_active=True,
                deleted_at__isnull=True,
            ).exclude(
                Q(role_ref__slug="guest") | Q(role_ref__isnull=True, role=5)
            ).values_list("member_id", flat=True)
        )
        added_members = added_members & eligible_member_ids

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
        TeamspaceMember.objects.bulk_create(bulk_team_space_members, ignore_conflicts=True, batch_size=100)

        team_space_members = TeamspaceMember.objects.filter(workspace__slug=slug, team_space_id=team_space_id)

        # Create activity
        team_space_activity.delay(
            type="team_space.activity.updated",
            slug=slug,
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            team_space_id=str(team_space.id),
            notification=True,
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        serializer = TeamspaceMemberSerializer(team_space_members, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.MANAGE, resource_param="team_space_id")
    def delete(self, request, slug, team_space_id, pk):
        # Get team space member
        team_space_member = TeamspaceMember.objects.get(workspace__slug=slug, team_space_id=team_space_id, pk=pk)

        # Get team space
        team_space = Teamspace.objects.get(workspace__slug=slug, pk=team_space_id)

        # Check if the member to be deleted is the lead
        if team_space.lead_id == team_space_member.member_id:
            return Response(
                {"error": "Cannot delete lead from team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the team space has only one member
        if TeamspaceMember.objects.filter(workspace__slug=slug, team_space_id=team_space_id).count() == 1:
            return Response(
                {"error": "Cannot delete the last member from team. Delete the team instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the current team space members
        current_team_space_members = TeamspaceMember.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("member_id", flat=True)

        current_instance = json.dumps({"member_ids": list(current_team_space_members)}, cls=DjangoJSONEncoder)

        # Get the list of team space members
        requested_team_space_members = list(
            TeamspaceMember.objects.filter(~Q(pk=pk), workspace__slug=slug, team_space_id=team_space_id).values_list(
                "member_id", flat=True
            )
        )

        requested_data = json.dumps({"member_ids": requested_team_space_members}, cls=DjangoJSONEncoder)

        # Create activity
        team_space_activity.delay(
            type="team_space.activity.updated",
            slug=slug,
            requested_data=requested_data,
            actor_id=str(request.user.id),
            team_space_id=str(team_space.id),
            notification=True,
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )

        # Delete team space member
        team_space_member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
