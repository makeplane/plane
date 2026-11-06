# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""URL routes for the page feature group, mounted under /api/v1/."""

from django.urls import path

from plane.nexus.views.page import (
    CollectionDetailEndpoint,
    CollectionListEndpoint,
    CollectionMemberDetailEndpoint,
    CollectionMemberListEndpoint,
    CollectionPageDetailEndpoint,
    CollectionPageListEndpoint,
    CollectionPageSearchEndpoint,
    NexusEstimatePointDetailEndpoint,
    NexusEstimatePointListCreateEndpoint,
    NexusProjectEstimateEndpoint,
    ProjectPageArchiveEndpoint,
    ProjectPageDetailEndpoint,
    ProjectPageListEndpoint,
    WorkItemPageDetailEndpoint,
    WorkItemPageEndpoint,
    WorkspacePageArchiveEndpoint,
    WorkspacePageDetailEndpoint,
    WorkspacePageListEndpoint,
)

WS = "workspaces/<str:slug>/"
PROJECT = WS + "projects/<uuid:project_id>/"
COLLECTION = WS + "collections/<uuid:collection_id>/"

urlpatterns = [
    # Workspace (wiki) pages
    path(WS + "pages/", WorkspacePageListEndpoint.as_view(http_method_names=["get", "post"]), name="nexus-ws-pages"),
    path(
        WS + "pages/<uuid:page_id>/",
        WorkspacePageDetailEndpoint.as_view(http_method_names=["get", "put", "patch", "delete"]),
        name="nexus-ws-page",
    ),
    path(
        WS + "pages/<uuid:page_id>/archive/",
        WorkspacePageArchiveEndpoint.as_view(http_method_names=["post", "delete"]),
        name="nexus-ws-page-archive",
    ),
    # Project pages
    path(
        PROJECT + "pages/",
        ProjectPageListEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-project-pages",
    ),
    path(
        PROJECT + "pages/<uuid:page_id>/",
        ProjectPageDetailEndpoint.as_view(http_method_names=["get", "put", "patch", "delete"]),
        name="nexus-project-page",
    ),
    path(
        PROJECT + "pages/<uuid:page_id>/archive/",
        ProjectPageArchiveEndpoint.as_view(http_method_names=["post", "delete"]),
        name="nexus-project-page-archive",
    ),
    # Work item ↔ page links
    path(
        PROJECT + "work-items/<uuid:work_item_id>/pages/",
        WorkItemPageEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-work-item-pages",
    ),
    path(
        PROJECT + "work-items/<uuid:work_item_id>/pages/<uuid:work_item_page_id>/",
        WorkItemPageDetailEndpoint.as_view(http_method_names=["get", "delete"]),
        name="nexus-work-item-page",
    ),
    # Collections
    path(
        WS + "collections/", CollectionListEndpoint.as_view(http_method_names=["get", "post"]), name="nexus-collections"
    ),
    path(
        COLLECTION,
        CollectionDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="nexus-collection",
    ),
    path(
        COLLECTION + "members/",
        CollectionMemberListEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-collection-members",
    ),
    path(
        COLLECTION + "members/<uuid:member_id>/",
        CollectionMemberDetailEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="nexus-collection-member",
    ),
    path(
        COLLECTION + "pages/",
        CollectionPageListEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-collection-pages",
    ),
    path(
        COLLECTION + "pages-search/",
        CollectionPageSearchEndpoint.as_view(http_method_names=["get"]),
        name="nexus-collection-pages-search",
    ),
    path(
        COLLECTION + "pages/<uuid:page_collection_id>/",
        CollectionPageDetailEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="nexus-collection-page",
    ),
    # Estimates: CE's own public views, which CE leaves unregistered
    path(
        PROJECT + "estimates/",
        NexusProjectEstimateEndpoint.as_view(http_method_names=["get", "post", "patch", "delete"]),
        name="nexus-project-estimate",
    ),
    path(
        PROJECT + "estimates/<uuid:estimate_id>/estimate-points/",
        NexusEstimatePointListCreateEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-estimate-points",
    ),
    path(
        PROJECT + "estimates/<uuid:estimate_id>/estimate-points/<uuid:estimate_point_id>/",
        NexusEstimatePointDetailEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="nexus-estimate-point",
    ),
]
