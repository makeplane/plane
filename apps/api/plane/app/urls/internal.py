# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import AgentSessionEndpoint

# Service-to-service endpoints. Not for browsers: guarded by a shared secret.
urlpatterns = [
    path(
        "internal/agent-sessions/",
        AgentSessionEndpoint.as_view(),
        name="internal-agent-sessions",
    ),
    path(
        "internal/agent-sessions/<uuid:token_id>/",
        AgentSessionEndpoint.as_view(),
        name="internal-agent-session-detail",
    ),
]
