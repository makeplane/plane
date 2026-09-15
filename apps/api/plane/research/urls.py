# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research namespace routes.

All research endpoints live under ``/api/research/`` and are registered ahead
of the existing ``/api/`` include so the namespace can never be shadowed by an
upstream route (P0-COMPAT-02).
"""

from django.urls import path

from plane.research.views import (
    ResearchHealthEndpoint,
    ResearchIdentityMappingDetailEndpoint,
    ResearchIdentityMappingListCreateEndpoint,
    ResearchIdentityMeEndpoint,
    ResearchMentorBindingDetailEndpoint,
    ResearchMentorBindingListCreateEndpoint,
    ResearchOrgUnitDetailEndpoint,
    ResearchOrgUnitListCreateEndpoint,
    ResearchOrgUnitMemberDetailEndpoint,
    ResearchOrgUnitMemberListCreateEndpoint,
    ResearchOrgUnitPiTransferEndpoint,
)

urlpatterns = [
    # availability probe (works even when the module switch is off)
    path("research/health/", ResearchHealthEndpoint.as_view(), name="research-health"),
    # identity
    path(
        "research/workspaces/<str:slug>/identity/me/",
        ResearchIdentityMeEndpoint.as_view(),
        name="research-identity-me",
    ),
    path(
        "research/workspaces/<str:slug>/identity/mappings/",
        ResearchIdentityMappingListCreateEndpoint.as_view(),
        name="research-identity-mappings",
    ),
    path(
        "research/workspaces/<str:slug>/identity/mappings/<uuid:pk>/",
        ResearchIdentityMappingDetailEndpoint.as_view(),
        name="research-identity-mapping",
    ),
    # organisation tree
    path(
        "research/workspaces/<str:slug>/org-units/",
        ResearchOrgUnitListCreateEndpoint.as_view(),
        name="research-org-units",
    ),
    path(
        "research/workspaces/<str:slug>/org-units/<uuid:pk>/",
        ResearchOrgUnitDetailEndpoint.as_view(),
        name="research-org-unit",
    ),
    path(
        "research/workspaces/<str:slug>/org-units/<uuid:pk>/members/",
        ResearchOrgUnitMemberListCreateEndpoint.as_view(),
        name="research-org-unit-members",
    ),
    path(
        "research/workspaces/<str:slug>/org-units/<uuid:pk>/members/<uuid:member_id>/",
        ResearchOrgUnitMemberDetailEndpoint.as_view(),
        name="research-org-unit-member",
    ),
    path(
        "research/workspaces/<str:slug>/org-units/<uuid:pk>/pi/",
        ResearchOrgUnitPiTransferEndpoint.as_view(),
        name="research-org-unit-pi",
    ),
    # direct advisors
    path(
        "research/workspaces/<str:slug>/mentors/",
        ResearchMentorBindingListCreateEndpoint.as_view(),
        name="research-mentors",
    ),
    path(
        "research/workspaces/<str:slug>/mentors/<uuid:pk>/",
        ResearchMentorBindingDetailEndpoint.as_view(),
        name="research-mentor",
    ),
]
