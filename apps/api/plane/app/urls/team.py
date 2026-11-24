# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    PortfolioArchiveEndpoint,
    PortfolioDetailEndpoint,
    PortfolioListEndpoint,
    ProjectMoveEndpoint,
    TeamArchiveEndpoint,
    TeamDetailEndpoint,
    TeamListEndpoint,
    TeamMemberDetailEndpoint,
    TeamMemberListEndpoint,
    TeamPortfolioListEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/teams/",
        TeamListEndpoint.as_view(),
        name="teams",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:team_id>/",
        TeamDetailEndpoint.as_view(),
        name="team-detail",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:team_id>/archive/",
        TeamArchiveEndpoint.as_view(),
        name="team-archive",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:team_id>/members/",
        TeamMemberListEndpoint.as_view(),
        name="team-members",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:team_id>/members/<uuid:pk>/",
        TeamMemberDetailEndpoint.as_view(),
        name="team-member-detail",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:team_id>/portfolios/",
        TeamPortfolioListEndpoint.as_view(),
        name="team-portfolios",
    ),
    path(
        "workspaces/<str:slug>/portfolios/",
        PortfolioListEndpoint.as_view(),
        name="portfolios",
    ),
    path(
        "workspaces/<str:slug>/portfolios/<uuid:portfolio_id>/",
        PortfolioDetailEndpoint.as_view(),
        name="portfolio-detail",
    ),
    path(
        "workspaces/<str:slug>/portfolios/<uuid:portfolio_id>/archive/",
        PortfolioArchiveEndpoint.as_view(),
        name="portfolio-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/move/",
        ProjectMoveEndpoint.as_view(),
        name="project-move",
    ),
]
