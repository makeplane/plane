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

from django.conf import settings

APPLICATIONS = {
    "github_enterprise": {
        "key": "github_enterprise",
        "name": "Github Enterprise Server",
        "slug": "github-enterprise",
        "short_description": "Github Enterprise Server Integration",
        "description_html": "<p>Github Enterprise Server Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/oauth/github-enterprise/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "github": {
        "key": "github",
        "name": "Github",
        "slug": "github",
        "short_description": "Github Integration",
        "description_html": "<p>Github Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/github/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "gitlab_enterprise": {
        "key": "gitlab_enterprise",
        "name": "Gitlab Enterprise Server",
        "slug": "gitlab-enterprise",
        "short_description": "Gitlab Enterprise Server Integration",
        "description_html": "<p>Gitlab Enterprise Server Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/oauth/gitlab-enterprise/auth/callback",
        "resource_permissions": ["read", "write"],
    },
    "gitlab": {
        "key": "gitlab",
        "name": "Gitlab",
        "slug": "gitlab",
        "short_description": "Gitlab Integration",
        "description_html": "<p>Gitlab Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/gitlab/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "slack": {
        "key": "slack",
        "name": "Slack",
        "slug": "slack",
        "short_description": "Slack Integration",
        "description_html": "<p>Slack Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/slack/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "bitbucket_dc": {
        "key": "bitbucket_dc",
        "name": "Bitbucket DC",
        "slug": "bitbucket-dc",
        "short_description": "Bitbucket Data Center Integration",
        "description_html": "<p>Bitbucket Data Center Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/oauth/bitbucket-dc/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "sentry": {
        "key": "sentry",
        "name": "Sentry",
        "slug": "sentry",
        "short_description": "Sentry Integration",
        "description_html": "<p>Sentry Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/oauth/sentry/plane-oauth/callback",
        "webhook_url": f"{settings.SILO_URL}/api/sentry/plane/events",
        "resource_permissions": ["read", "write"],
    },
    "importer": {
        "key": "importer",
        "name": "Importer",
        "slug": "importer",
        "short_description": "Importer",
        "description_html": "<p>Importer</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/importer/plane-oauth/callback",
        "resource_permissions": ["read", "write"],
    },
    "drawio": {
        "key": "drawio",
        "name": "Drawio",
        "slug": "drawio",
        "short_description": "Create and edit powerful diagrams and whiteboards directly inside Plane Pages with draw.io.",  # noqa: E501
        "description_html": "<p>Drawio Integration</p>",
        "setup_url": f"{settings.SILO_URL}/api/apps/drawio/auth/consent-url/",
        "redirect_uris": f"{settings.SILO_URL}/api/apps/drawio/auth/callback",
        "skip_authorization": False,
        "resource_permissions": ["read", "write"],
    },
    "plane_ai": {
        "key": "plane_ai",
        "name": "Plane AI",
        "slug": "plane-ai",
        "short_description": "Plane AI Integration",
        "description_html": "<p>Plane AI Integration</p>",
        "redirect_uris": f"{settings.PI_URL}/api/v1/oauth/callback/",
        "skip_authorization": True,
        "resource_permissions": ["read", "write"],
    },
    "runner": {
        "key": "runner",
        "name": "Runner",
        "slug": "runner",
        "short_description": "Runner",
        "description_html": "<p>Runner</p>",
        "setup_url": f"{settings.SILO_URL}/api/apps/runner/auth/consent-url/",
        "redirect_uris": f"{settings.SILO_URL}/api/apps/runner/auth/callback",
        "skip_authorization": False,
        "resource_permissions": ["read", "write"],
    },
    "cursor": {
        "key": "cursor",
        "name": "Cursor",
        "slug": "cursor",
        "short_description": "Launch Cursor AI coding agents from Plane work items.",
        "description_html": "<p>Cursor AI Agent Integration</p>",
        "setup_url": f"{settings.SILO_URL}/api/apps/CURSOR/auth/consent-url/",
        "redirect_uris": f"{settings.SILO_URL}/api/apps/CURSOR/auth/callback",
        "webhook_url": f"{settings.SILO_URL}/api/agents/webhook/cursor",
        "skip_authorization": False,
        "is_mentionable": True,
        "resource_permissions": ["read", "write"],
        "configuration_url": "settings/integrations/cursor"
    },
    "oauth-bridge": {
        "key": "oauth-bridge",
        "name": "OAuth Bridge",
        "slug": "oauth-bridge",
        "short_description": "Validate external IdP tokens for API access",
        "description_html": "<p>Accept OAuth/OIDC tokens from external identity providers (e.g. Azure AD, ADFS) and map them to Plane users, enabling external apps to call the Plane API without managing separate credentials.</p>", #noqa: E501
        "setup_url": "",
        "redirect_uris": "",
        "skip_authorization": True,
        "resource_permissions": ["read", "write"],
        "configuration_url": "settings/integrations/oauth-bridge",
    },
}
