# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import ImportWorkItemsEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/import-work-items/",
        ImportWorkItemsEndpoint.as_view(),
        name="import-work-items",
    ),
]
