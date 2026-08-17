# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.testhub.views import (
    ProjectTestRepoEndpoint,
    TesthubCatalogEndpoint,
    TesthubFileEndpoint,
    TesthubJobEndpoint,
    TesthubOverlayEndpoint,
    TesthubSessionEndpoint,
    TesthubSyncEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/repo/",
        ProjectTestRepoEndpoint.as_view(),
        name="testhub-repo",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/catalog/",
        TesthubCatalogEndpoint.as_view(),
        name="testhub-catalog",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/sync/",
        TesthubSyncEndpoint.as_view(),
        name="testhub-sync",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/files/",
        TesthubFileEndpoint.as_view(),
        name="testhub-files",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/jobs/",
        TesthubJobEndpoint.as_view(),
        name="testhub-jobs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/jobs/<uuid:pk>/",
        TesthubJobEndpoint.as_view(),
        name="testhub-job-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/overlays/",
        TesthubOverlayEndpoint.as_view(),
        name="testhub-overlays",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/sessions/",
        TesthubSessionEndpoint.as_view(),
        name="testhub-sessions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/testhub/sessions/<uuid:pk>/",
        TesthubSessionEndpoint.as_view(),
        name="testhub-session-detail",
    ),
]
