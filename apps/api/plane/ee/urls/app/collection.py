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

# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.collection import (
    CollectionAddablePageSearchEndpoint,
    CollectionEndpoint,
    CollectionMemberEndpoint,
    PageCollectionEndpoint,
    MoveCollectionPagesEndpoint,
)

urlpatterns = [
    # Collection CRUD
    path(
        "workspaces/<str:slug>/collections/",
        CollectionEndpoint.as_view(),
        name="collections",
    ),
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/",
        CollectionEndpoint.as_view(),
        name="collection-detail",
    ),
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/move-pages/",
        MoveCollectionPagesEndpoint.as_view(),
        name="collection-move-pages",
    ),
    # Collection members (for private collections)
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/members/",
        CollectionMemberEndpoint.as_view(),
        name="collection-members",
    ),
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/members/<uuid:pk>/",
        CollectionMemberEndpoint.as_view(),
        name="collection-member-detail",
    ),
    # Pages within a collection
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/pages/",
        PageCollectionEndpoint.as_view(),
        name="collection-pages",
    ),
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/pages-search/",
        CollectionAddablePageSearchEndpoint.as_view(),
        name="collection-pages-search",
    ),
    path(
        "workspaces/<str:slug>/collections/<uuid:collection_id>/pages/<uuid:pk>/",
        PageCollectionEndpoint.as_view(),
        name="collection-page-detail",
    ),
]
