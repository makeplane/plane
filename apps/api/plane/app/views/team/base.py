# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import OuterRef, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission, can_manage_team, is_team_admin, is_workspace_admin
from plane.app.serializers import PortfolioSerializer, TeamMemberSerializer, TeamSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Portfolio, Project, Team, TeamKind, TeamMember, User, Workspace, WorkspaceMember
from plane.utils.team_access import (
    TEAM_ADMIN,
    TEAM_MEMBER,
    TeamAccessError,
    assert_team_admin_remains,
    reconcile_project_access,
    reconcile_team_access,
)

logger = logging.getLogger("plane.api")

# Guests do not see teams.
TEAM_READERS = [ROLE.ADMIN, ROLE.MEMBER]


def bad_request(error):
    return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)


def forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


def log_change(request, action, **details):
    logger.info("team structure: %s", action, extra={"actor_id": str(request.user.id), **details})


class TeamBaseView(BaseAPIView):
    # Permission checks must not read a lagging replica.
    use_read_replica = False

    def handle_exception(self, exc):
        if isinstance(exc, TeamAccessError):
            return bad_request(str(exc))
        if isinstance(exc, IntegrityError):
            return bad_request("This name, member or management team already exists.")
        return super().handle_exception(exc)

    def get_team(self, slug, team_id, lock=False):
        teams = Team.objects.select_for_update() if lock else Team.objects
        return get_object_or_404(teams, pk=team_id, workspace__slug=slug)

    def get_portfolio(self, slug, portfolio_id, lock=False):
        portfolios = Portfolio.objects.select_for_update() if lock else Portfolio.objects
        return get_object_or_404(portfolios, pk=portfolio_id, workspace__slug=slug)

    def annotated_teams(self, request, slug):
        return Team.objects.filter(workspace__slug=slug).annotate(
            member_role=Subquery(
                TeamMember.objects.filter(team_id=OuterRef("pk"), member=request.user).values("role")[:1]
            )
        )


class TeamListEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug):
        teams = self.annotated_teams(request, slug).order_by("name")
        return Response(TeamSerializer(teams, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        # The first admin is the creator unless others are named.
        admin_ids = {str(admin_id) for admin_id in request.data.get("admin_ids") or [request.user.id]}
        serializer = TeamSerializer(data=request.data, context={"workspace_id": workspace.id})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            error = check_team_candidates(slug, admin_ids)
            if error:
                return bad_request(error)
            team = serializer.save(workspace_id=workspace.id)
            for admin_id in admin_ids:
                TeamMember.objects.create(team=team, member_id=admin_id, role=TEAM_ADMIN)
        log_change(request, "team created", team_id=str(team.id))
        team = self.annotated_teams(request, slug).get(pk=team.pk)
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)


class TeamDetailEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug, team_id):
        team = get_object_or_404(self.annotated_teams(request, slug), pk=team_id)
        return Response(TeamSerializer(team).data, status=status.HTTP_200_OK)

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def patch(self, request, slug, team_id):
        team = self.get_team(slug, team_id)
        if not can_manage_team(request.user, slug, team_id):
            return forbidden()
        # The kind decides who sees the product board, so only workspace admins change it.
        if "kind" in request.data and not is_workspace_admin(request.user, slug):
            return forbidden()
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            serializer = TeamSerializer(
                team, data=request.data, partial=True, context={"workspace_id": team.workspace_id}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
        team = self.annotated_teams(request, slug).get(pk=team_id)
        return Response(TeamSerializer(team).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, team_id):
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            if team.portfolios.exists():
                return bad_request("Only a team without portfolios can be deleted.")
            TeamMember.objects.filter(team=team).delete()
            # Nothing else depends on an empty team, so no cascade is needed.
            Team.objects.filter(pk=team.pk).delete()
        log_change(request, "team deleted", team_id=str(team_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamArchiveEndpoint(TeamBaseView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, team_id):
        return self._set(request, slug, team_id, timezone.now())

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, team_id):
        return self._set(request, slug, team_id, None)

    def _set(self, request, slug, team_id, archived_at):
        team = self.get_team(slug, team_id)
        team.archived_at = archived_at
        team.save(update_fields=["archived_at", "updated_at", "updated_by"])
        log_change(request, "team archived" if archived_at else "team restored", team_id=str(team_id))
        return Response({"archived_at": archived_at}, status=status.HTTP_200_OK)


def check_team_candidates(slug, user_ids):
    """Return an error unless every user is an active, non-guest, human member of the workspace."""
    valid = {
        str(member_id)
        for member_id in WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member_id__in=user_ids,
            is_active=True,
            role__gt=ROLE.GUEST.value,
            member__is_bot=False,
            member__is_active=True,
        ).values_list("member_id", flat=True)
    }
    if set(user_ids) - valid:
        return "Only active, non-guest members of the workspace can join a team."
    return None


class TeamMemberListEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug, team_id):
        team = self.get_team(slug, team_id)
        members = TeamMember.objects.filter(team=team).order_by("-role", "created_at")
        return Response(TeamMemberSerializer(members, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def post(self, request, slug, team_id):
        self.get_team(slug, team_id)
        if not can_manage_team(request.user, slug, team_id):
            return forbidden()
        role = request.data.get("role", TEAM_MEMBER)
        if role not in (TEAM_ADMIN, TEAM_MEMBER):
            return bad_request("Invalid role.")
        member_ids = {str(member_id) for member_id in request.data.get("member_ids") or []}
        if not member_ids:
            return bad_request("At least one member is required.")
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            error = check_team_candidates(slug, member_ids)
            if error:
                return bad_request(error)
            if TeamMember.objects.filter(team=team, member_id__in=member_ids).exists():
                return bad_request("Some of the users are already in the team.")
            for member_id in member_ids:
                TeamMember.objects.create(team=team, member_id=member_id, role=role)
            reconcile_team_access(team.id, member_ids)
        log_change(request, "members added", team_id=str(team_id), member_ids=sorted(member_ids), role=role)
        members = TeamMember.objects.filter(team_id=team_id, member_id__in=member_ids)
        return Response(TeamMemberSerializer(members, many=True).data, status=status.HTTP_201_CREATED)


class TeamMemberDetailEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def patch(self, request, slug, team_id, pk):
        if not can_manage_team(request.user, slug, team_id):
            return forbidden()
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            membership = get_object_or_404(TeamMember, pk=pk, team=team)
            serializer = TeamMemberSerializer(membership, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            if membership.role == TEAM_ADMIN and serializer.validated_data.get("role") == TEAM_MEMBER:
                assert_team_admin_remains(team, membership.member_id)
            serializer.save()
            reconcile_team_access(team.id, [membership.member_id])
        log_change(
            request,
            "member role changed",
            team_id=str(team_id),
            member_id=str(membership.member_id),
            role=membership.role,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def delete(self, request, slug, team_id, pk):
        self.get_team(slug, team_id)
        is_self = TeamMember.objects.filter(pk=pk, team_id=team_id, member=request.user).exists()
        # Anyone may leave their own team.
        if not is_self and not can_manage_team(request.user, slug, team_id):
            return forbidden()
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            membership = get_object_or_404(TeamMember, pk=pk, team=team)
            if membership.role == TEAM_ADMIN:
                assert_team_admin_remains(team, membership.member_id)
            TeamMember.objects.filter(pk=pk).delete()
            reconcile_team_access(team.id, [membership.member_id])
        log_change(request, "member removed", team_id=str(team_id), member_id=str(membership.member_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class PortfolioListEndpoint(TeamBaseView):
    """Every portfolio of the workspace, for the navigation tree."""

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug):
        portfolios = Portfolio.objects.filter(workspace__slug=slug)
        return Response(PortfolioSerializer(portfolios, many=True).data, status=status.HTTP_200_OK)


class TeamPortfolioListEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug, team_id):
        team = self.get_team(slug, team_id)
        portfolios = Portfolio.objects.filter(team=team)
        return Response(PortfolioSerializer(portfolios, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def post(self, request, slug, team_id):
        self.get_team(slug, team_id)
        if not can_manage_team(request.user, slug, team_id):
            return forbidden()
        with transaction.atomic():
            team = self.get_team(slug, team_id, lock=True)
            if team.kind == TeamKind.MANAGEMENT:
                return bad_request("The management team cannot have portfolios.")
            if team.archived_at:
                return bad_request("The team is archived.")
            serializer = PortfolioSerializer(
                data=request.data, context={"workspace_id": team.workspace_id, "team_id": team.id}
            )
            serializer.is_valid(raise_exception=True)
            portfolio = serializer.save(team=team)
        log_change(request, "portfolio created", team_id=str(team_id), portfolio_id=str(portfolio.id))
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PortfolioDetailEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def get(self, request, slug, portfolio_id):
        return Response(
            PortfolioSerializer(self.get_portfolio(slug, portfolio_id)).data, status=status.HTTP_200_OK
        )

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def patch(self, request, slug, portfolio_id):
        portfolio = self.get_portfolio(slug, portfolio_id)
        if not can_manage_team(request.user, slug, portfolio.team_id):
            return forbidden()
        serializer = PortfolioSerializer(
            portfolio,
            data=request.data,
            partial=True,
            context={"workspace_id": portfolio.workspace_id, "team_id": portfolio.team_id},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def delete(self, request, slug, portfolio_id):
        with transaction.atomic():
            portfolio = self.get_portfolio(slug, portfolio_id, lock=True)
            if not can_manage_team(request.user, slug, portfolio.team_id):
                return forbidden()
            # Archived projects count as content too.
            if Project.objects.filter(portfolio=portfolio).exists():
                return bad_request("Only an empty portfolio can be deleted.")
            Portfolio.objects.filter(pk=portfolio.pk).delete()
        log_change(request, "portfolio deleted", portfolio_id=str(portfolio_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class PortfolioArchiveEndpoint(TeamBaseView):
    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def post(self, request, slug, portfolio_id):
        return self._set(request, slug, portfolio_id, timezone.now())

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def delete(self, request, slug, portfolio_id):
        return self._set(request, slug, portfolio_id, None)

    def _set(self, request, slug, portfolio_id, archived_at):
        portfolio = self.get_portfolio(slug, portfolio_id)
        if not can_manage_team(request.user, slug, portfolio.team_id):
            return forbidden()
        portfolio.archived_at = archived_at
        portfolio.save(update_fields=["archived_at", "updated_at", "updated_by"])
        log_change(
            request,
            "portfolio archived" if archived_at else "portfolio restored",
            portfolio_id=str(portfolio_id),
        )
        return Response({"archived_at": archived_at}, status=status.HTTP_200_OK)


class ProjectMoveEndpoint(TeamBaseView):
    """
    Move a project to another portfolio, or preview who gains and loses access with `dry_run`.

    Inside one team its admins may do it; any other move needs a workspace admin.
    """

    @allow_permission(TEAM_READERS, level="WORKSPACE")
    def post(self, request, slug, project_id):
        dry_run = request.data.get("dry_run", False)
        if not isinstance(dry_run, bool):
            return bad_request("`dry_run` must be a boolean.")
        portfolio_id = request.data.get("portfolio_id")

        with transaction.atomic():
            # Portfolio before project: the same lock order as project creation.
            portfolio = None
            if portfolio_id is not None:
                portfolio = self.get_portfolio(slug, portfolio_id, lock=True)
            project = get_object_or_404(
                Project.objects.select_for_update(), pk=project_id, workspace__slug=slug
            )
            current_team_id = project.portfolio.team_id if project.portfolio_id else None
            same_team = portfolio is not None and portfolio.team_id == current_team_id
            allowed = is_workspace_admin(request.user, slug) or (
                same_team and is_team_admin(request.user, slug, current_team_id)
            )
            if not allowed:
                return forbidden()
            if portfolio is not None and (portfolio.archived_at or portfolio.team.archived_at):
                return bad_request("The portfolio or its team is archived.")

            project.portfolio = portfolio
            project.save(update_fields=["portfolio", "updated_at", "updated_by"])
            changes = reconcile_project_access([project.id])
            names = dict(
                User.objects.filter(id__in=[change.member_id for change in changes]).values_list(
                    "id", "display_name"
                )
            )
            if dry_run:
                transaction.set_rollback(True)

        if not dry_run:
            log_change(
                request,
                "project moved",
                project_id=str(project_id),
                from_team_id=str(current_team_id),
                portfolio_id=str(portfolio_id),
            )

        def describe(change):
            return {
                "member": str(change.member_id),
                "display_name": names.get(change.member_id, ""),
                "before": change.before,
                "after": change.after,
            }

        return Response(
            {
                "dry_run": dry_run,
                "gained": [describe(c) for c in changes if c.before is None],
                "lost": [describe(c) for c in changes if c.after is None],
                "changed": [describe(c) for c in changes if c.before is not None and c.after is not None],
            },
            status=status.HTTP_200_OK,
        )
