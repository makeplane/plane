# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.gitsync.views import (
    GitRemoteDetailEndpoint,
    GitRemoteListEndpoint,
    GitRemoteSyncEndpoint,
    ModuleBindingListEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/gitsync/remotes/",
        GitRemoteListEndpoint.as_view(),
        name="gitsync-remotes",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/gitsync/remotes/<uuid:pk>/",
        GitRemoteDetailEndpoint.as_view(),
        name="gitsync-remote-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/gitsync/remotes/<uuid:pk>/sync/",
        GitRemoteSyncEndpoint.as_view(),
        name="gitsync-remote-sync",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/gitsync/bindings/",
        ModuleBindingListEndpoint.as_view(),
        name="gitsync-bindings",
    ),
]
