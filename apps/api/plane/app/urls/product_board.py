# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import ProductBoardDetailEndpoint, ProductBoardEndpoint, ProductBoardStatesEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/product-board/",
        ProductBoardEndpoint.as_view(),
        name="product-board",
    ),
    path(
        "workspaces/<str:slug>/product-board/states/",
        ProductBoardStatesEndpoint.as_view(),
        name="product-board-states",
    ),
    path(
        "workspaces/<str:slug>/product-board/<uuid:pk>/",
        ProductBoardDetailEndpoint.as_view(),
        name="product-board-detail",
    ),
]
