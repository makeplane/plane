# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import CalendarAudit, OpsTeam, OpsTeamMember
from plane.team_ops.serializers import TeamSerializer, TeamWriteSerializer
from plane.team_ops.services.audit import record_audit
from plane.team_ops.services.access import CALENDAR_ROLES, calendar_user_ids

ADMIN_ONLY = [ROLE.ADMIN]


def _teams(slug):
    return OpsTeam.objects.filter(workspace__slug=slug).prefetch_related("members")


def _serialize(workspace, teams, many=False):
    return TeamSerializer(teams, many=many, context={"eligible_user_ids": calendar_user_ids(workspace)}).data


def _snapshot(team):
    """The audited state of a team as plain JSON values."""
    members = OpsTeamMember.objects.filter(team=team).values_list("user_id", "role")
    return {
        "id": str(team.id),
        "name": team.name,
        "description": team.description,
        "members": sorted(({"user": str(user_id), "role": role} for user_id, role in members), key=lambda m: m["user"]),
    }


def _bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def _unknown_members(workspace, members):
    """Listed users who are not active admins or members of the workspace."""
    return {member["user"] for member in members} - calendar_user_ids(workspace)


def _name_taken(workspace, name, exclude=None):
    queryset = OpsTeam.objects.filter(workspace=workspace, name__iexact=name)
    if exclude is not None:
        queryset = queryset.exclude(pk=exclude.pk)
    return queryset.exists()


def _replace_members(team, members):
    existing = {row.user_id: row for row in OpsTeamMember.objects.filter(team=team)}
    # A PATCH is a partial update, which skips the serializer default for `role`.
    wanted = {member["user"]: member.get("role", OpsTeamMember.Role.MEMBER) for member in members}

    for user_id, row in existing.items():
        if user_id not in wanted:
            row.delete(soft=False)
        elif row.role != wanted[user_id]:
            row.role = wanted[user_id]
            row.save()
    for user_id, role in wanted.items():
        if user_id not in existing:
            OpsTeamMember.objects.create(team=team, user_id=user_id, role=role)


class TeamEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        return Response(_serialize(workspace, _teams(slug), many=True), status=status.HTTP_200_OK)

    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = TeamWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        members = data.get("members", [])

        if _unknown_members(workspace, members):
            return _bad_request("Every team member must be an active member of this workspace.")
        if _name_taken(workspace, data["name"]):
            return _bad_request("A team with this name already exists.")

        try:
            with transaction.atomic():
                team = OpsTeam.objects.create(
                    workspace=workspace, name=data["name"], description=data.get("description", "")
                )
                _replace_members(team, members)
                record_audit(
                    workspace=workspace,
                    entity=CalendarAudit.Entity.TEAM,
                    action=CalendarAudit.Action.CREATE,
                    changed_by=request.user,
                    new=_snapshot(team),
                )
        except IntegrityError:
            return _bad_request("A team with this name already exists.")

        return Response(_serialize(workspace, _teams(slug).get(pk=team.pk)), status=status.HTTP_201_CREATED)


class TeamDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        team = _teams(slug).filter(pk=pk).first()
        if team is None:
            return Response({"error": "Team not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize(team.workspace, team), status=status.HTTP_200_OK)

    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def patch(self, request, slug, pk):
        team = _teams(slug).select_related("workspace").filter(pk=pk).first()
        if team is None:
            return Response({"error": "Team not found."}, status=status.HTTP_404_NOT_FOUND)
        workspace = team.workspace

        serializer = TeamWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        members = data.get("members")

        if members is not None and _unknown_members(workspace, members):
            return _bad_request("Every team member must be an active member of this workspace.")
        if "name" in data and _name_taken(workspace, data["name"], exclude=team):
            return _bad_request("A team with this name already exists.")

        try:
            with transaction.atomic():
                before = _snapshot(team)
                if "name" in data:
                    team.name = data["name"]
                if "description" in data:
                    team.description = data["description"]
                team.save()
                if members is not None:
                    _replace_members(team, members)
                after = _snapshot(team)
                if after != before:
                    record_audit(
                        workspace=workspace,
                        entity=CalendarAudit.Entity.TEAM,
                        action=CalendarAudit.Action.UPDATE,
                        changed_by=request.user,
                        old=before,
                        new=after,
                    )
        except IntegrityError:
            return _bad_request("A team with this name already exists.")

        return Response(_serialize(workspace, _teams(slug).get(pk=team.pk)), status=status.HTTP_200_OK)

    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def delete(self, request, slug, pk):
        team = _teams(slug).select_related("workspace").filter(pk=pk).first()
        if team is None:
            return Response({"error": "Team not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            before = _snapshot(team)
            # Hard delete: the audit row keeps the history, and members go with the team.
            team.delete(soft=False)
            record_audit(
                workspace=team.workspace,
                entity=CalendarAudit.Entity.TEAM,
                action=CalendarAudit.Action.DELETE,
                changed_by=request.user,
                old=before,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
