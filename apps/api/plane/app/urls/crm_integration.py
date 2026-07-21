# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    CrmIntegrationEndpoint,
    CrmIntegrationTestEndpoint,
    CrmIntegrationSyncEndpoint,
    CrmIntegrationCrmFieldsEndpoint,
    CrmSyncLogEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/crm-integration/",
        CrmIntegrationEndpoint.as_view(),
        name="crm-integration",
    ),
    path(
        "workspaces/<str:slug>/crm-integration/test/",
        CrmIntegrationTestEndpoint.as_view(),
        name="crm-integration-test",
    ),
    path(
        "workspaces/<str:slug>/crm-integration/sync/",
        CrmIntegrationSyncEndpoint.as_view(),
        name="crm-integration-sync",
    ),
    path(
        "workspaces/<str:slug>/crm-integration/crm-fields/",
        CrmIntegrationCrmFieldsEndpoint.as_view(),
        name="crm-integration-crm-fields",
    ),
    path(
        "workspaces/<str:slug>/crm-integration/logs/",
        CrmSyncLogEndpoint.as_view(),
        name="crm-integration-logs",
    ),
]
