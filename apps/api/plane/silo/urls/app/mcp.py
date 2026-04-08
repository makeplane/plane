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
from plane.silo.views import (
    MCPApplicationsInternalAPIView,
    MCPApplicationAPIView,
    MCPApplicationConnectAPIView,
    MCPApplicationCredentialsAPIView,
    MCPApplicationDisconnectAPIView,
    MCPApplicationOAuthCallbackAPIView,
    MCPApplicationOAuthConnectAPIView,
)

mcp_urlpatterns = [
    # OAuth callback — no slug (browser redirect from external OAuth provider)
    path(
        "mcp-applications/oauth/callback/",
        MCPApplicationOAuthCallbackAPIView.as_view(),
        name="mcp-oauth-callback",
    ),
    # MCP application list / create
    path(
        "workspaces/<str:slug>/mcp-applications/",
        MCPApplicationAPIView.as_view(),
        name="mcp-applications",
    ),
    # Pi-internal connectors — returns decrypted auth headers
    path(
        "workspaces/<str:slug>/mcp-applications/internal/",
        MCPApplicationsInternalAPIView.as_view(),
        name="mcp-applications-internal",
    ),
    # MCP application detail / update / delete
    path(
        "workspaces/<str:slug>/mcp-applications/<uuid:pk>/",
        MCPApplicationAPIView.as_view(),
        name="mcp-application-detail",
    ),
    # Credentials (headers) for an MCP application
    path(
        "workspaces/<str:slug>/mcp-applications/<uuid:pk>/credentials/",
        MCPApplicationCredentialsAPIView.as_view(),
        name="mcp-application-credentials",
    ),
    # Connect (none / header auth)
    path(
        "workspaces/<str:slug>/mcp-applications/<uuid:pk>/connect/",
        MCPApplicationConnectAPIView.as_view(),
        name="mcp-application-connect",
    ),
    # Connect (OAuth) — browser redirect flow
    path(
        "workspaces/<str:slug>/mcp-applications/<uuid:pk>/connect/oauth/",
        MCPApplicationOAuthConnectAPIView.as_view(),
        name="mcp-application-connect-oauth",
    ),
    # Disconnect an MCP application
    path(
        "workspaces/<str:slug>/mcp-applications/<uuid:pk>/disconnect/",
        MCPApplicationDisconnectAPIView.as_view(),
        name="mcp-application-disconnect",
    )
]
