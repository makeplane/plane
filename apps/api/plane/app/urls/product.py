# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import ProductTypeDetailEndpoint, ProductTypeListEndpoint, WorkspaceProductListEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/product-types/",
        ProductTypeListEndpoint.as_view(),
        name="product-types",
    ),
    path(
        "workspaces/<str:slug>/product-types/<uuid:pk>/",
        ProductTypeDetailEndpoint.as_view(),
        name="product-type-detail",
    ),
    path(
        "workspaces/<str:slug>/products/",
        WorkspaceProductListEndpoint.as_view(),
        name="workspace-products",
    ),
]
