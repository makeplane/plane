# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import SyncReplayEndpoint

urlpatterns = [
    path("workspaces/<str:slug>/sync/replay/", SyncReplayEndpoint.as_view(), name="sync-replay")
]
