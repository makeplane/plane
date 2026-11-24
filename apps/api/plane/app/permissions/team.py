# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.exceptions import ValidationError

# Module imports
from plane.db.models import Portfolio, TeamMember, WorkspaceMember
from plane.utils.team_access import TEAM_ADMIN

from .base import ROLE


def is_workspace_admin(user, slug):
    return WorkspaceMember.objects.filter(
        workspace__slug=slug, member=user, role=ROLE.ADMIN.value, is_active=True
    ).exists()


def is_team_admin(user, slug, team_id):
    """Whether the user is an admin of the team and still an active non-guest of the workspace."""
    return (
        TeamMember.objects.filter(team_id=team_id, workspace__slug=slug, member=user, role=TEAM_ADMIN).exists()
        and WorkspaceMember.objects.filter(
            workspace__slug=slug, member=user, role__gt=ROLE.GUEST.value, is_active=True
        ).exists()
    )


def can_manage_team(user, slug, team_id):
    return is_workspace_admin(user, slug) or is_team_admin(user, slug, team_id)


class PortfolioChoiceError(Exception):
    """The portfolio given for a new project is missing, unusable or not the user's to use."""

    def __init__(self, message, status_code):
        super().__init__(message)
        self.status_code = status_code


def get_portfolio_for_new_project(user, workspace, portfolio_id):
    """
    Lock and return the portfolio a new project goes to, or None when the project has none.

    Must run inside a transaction. Once the workspace uses the team structure every new project
    needs a portfolio, and only the admins of its team or of the workspace may create it.
    """
    if not portfolio_id:
        if workspace.is_team_structure_enabled:
            raise PortfolioChoiceError("A portfolio is required.", 400)
        return None
    try:
        portfolio = Portfolio.objects.select_for_update(of=("self",)).select_related("team").get(
            pk=portfolio_id, workspace=workspace
        )
    except (Portfolio.DoesNotExist, ValidationError):
        raise PortfolioChoiceError("The portfolio does not exist.", 400)
    if not can_manage_team(user, workspace.slug, portfolio.team_id):
        raise PortfolioChoiceError("You don't have the required permissions.", 403)
    if portfolio.archived_at or portfolio.team.archived_at:
        raise PortfolioChoiceError("The portfolio or its team is archived.", 400)
    return portfolio
