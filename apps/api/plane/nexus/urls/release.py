# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""URL routes for the release feature group, mounted under /api/v1/."""

from django.urls import path

from plane.nexus.views.release import (
    InitiativeDetailAPIEndpoint,
    InitiativeListCreateAPIEndpoint,
    InitiativeProjectAPIEndpoint,
    InitiativeWorkItemAPIEndpoint,
    MilestoneDetailAPIEndpoint,
    MilestoneListCreateAPIEndpoint,
    MilestoneWorkItemAPIEndpoint,
    ReleaseChangelogAPIEndpoint,
    ReleaseDetailAPIEndpoint,
    ReleaseItemLabelAPIEndpoint,
    ReleaseLabelDetailAPIEndpoint,
    ReleaseLabelListCreateAPIEndpoint,
    ReleaseListCreateAPIEndpoint,
    ReleaseTagDetailAPIEndpoint,
    ReleaseTagListCreateAPIEndpoint,
    ReleaseWorkItemAPIEndpoint,
)

WS = "workspaces/<str:slug>/"
LIST = ["get", "post"]
DETAIL = ["get", "patch", "delete"]
LINKS = ["get", "post", "delete"]

urlpatterns = [
    # releases: labels and tags first, so their literal segments read clearly
    path(
        f"{WS}releases/labels/",
        ReleaseLabelListCreateAPIEndpoint.as_view(http_method_names=LIST),
        name="nexus-release-labels",
    ),
    path(
        f"{WS}releases/labels/<uuid:label_id>/",
        ReleaseLabelDetailAPIEndpoint.as_view(http_method_names=DETAIL),
        name="nexus-release-label-detail",
    ),
    path(
        f"{WS}releases/tags/",
        ReleaseTagListCreateAPIEndpoint.as_view(http_method_names=LIST),
        name="nexus-release-tags",
    ),
    path(
        f"{WS}releases/tags/<uuid:tag_id>/",
        ReleaseTagDetailAPIEndpoint.as_view(http_method_names=DETAIL),
        name="nexus-release-tag-detail",
    ),
    path(f"{WS}releases/", ReleaseListCreateAPIEndpoint.as_view(http_method_names=LIST), name="nexus-releases"),
    path(
        f"{WS}releases/<uuid:release_id>/",
        ReleaseDetailAPIEndpoint.as_view(http_method_names=DETAIL),
        name="nexus-release-detail",
    ),
    path(
        f"{WS}releases/<uuid:release_id>/changelog/",
        ReleaseChangelogAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="nexus-release-changelog",
    ),
    path(
        f"{WS}releases/<uuid:release_id>/labels/",
        ReleaseItemLabelAPIEndpoint.as_view(http_method_names=LINKS),
        name="nexus-release-item-labels",
    ),
    path(
        f"{WS}releases/<uuid:release_id>/work-items/",
        ReleaseWorkItemAPIEndpoint.as_view(http_method_names=LINKS),
        name="nexus-release-work-items",
    ),
    # milestones (project-scoped)
    path(
        f"{WS}projects/<uuid:project_id>/milestones/",
        MilestoneListCreateAPIEndpoint.as_view(http_method_names=LIST),
        name="nexus-milestones",
    ),
    path(
        f"{WS}projects/<uuid:project_id>/milestones/<uuid:milestone_id>/",
        MilestoneDetailAPIEndpoint.as_view(http_method_names=DETAIL),
        name="nexus-milestone-detail",
    ),
    path(
        f"{WS}projects/<uuid:project_id>/milestones/<uuid:milestone_id>/work-items/",
        MilestoneWorkItemAPIEndpoint.as_view(http_method_names=LINKS),
        name="nexus-milestone-work-items",
    ),
    # initiatives
    path(
        f"{WS}initiatives/", InitiativeListCreateAPIEndpoint.as_view(http_method_names=LIST), name="nexus-initiatives"
    ),
    path(
        f"{WS}initiatives/<uuid:initiative_id>/",
        InitiativeDetailAPIEndpoint.as_view(http_method_names=DETAIL),
        name="nexus-initiative-detail",
    ),
    path(
        f"{WS}initiatives/<uuid:initiative_id>/projects/",
        InitiativeProjectAPIEndpoint.as_view(http_method_names=LINKS),
        name="nexus-initiative-projects",
    ),
    path(
        f"{WS}initiatives/<uuid:initiative_id>/work-items/",
        InitiativeWorkItemAPIEndpoint.as_view(http_method_names=LINKS),
        name="nexus-initiative-work-items",
    ),
]
