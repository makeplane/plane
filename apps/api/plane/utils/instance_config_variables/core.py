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

# Python imports
import os

authentication_config_variables = [
    {
        "key": "ENABLE_SIGNUP",
        "value": os.environ.get("ENABLE_SIGNUP", "1"),
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "ENABLE_EMAIL_PASSWORD",
        "value": os.environ.get("ENABLE_EMAIL_PASSWORD", "1"),
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "ENABLE_MAGIC_LINK_LOGIN",
        "value": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "0"),
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
]

workspace_management_config_variables = [
    {
        "key": "DISABLE_WORKSPACE_CREATION",
        "value": os.environ.get("DISABLE_WORKSPACE_CREATION", "0"),
        "category": "WORKSPACE_MANAGEMENT",
        "is_encrypted": False,
    },
]

google_config_variables = [
    {
        "key": "GOOGLE_CLIENT_ID",
        "value": os.environ.get("GOOGLE_CLIENT_ID"),
        "category": "GOOGLE",
        "is_encrypted": False,
    },
    {
        "key": "GOOGLE_CLIENT_SECRET",
        "value": os.environ.get("GOOGLE_CLIENT_SECRET"),
        "category": "GOOGLE",
        "is_encrypted": True,
    },
    {
        "key": "ENABLE_GOOGLE_SYNC",
        "value": os.environ.get("ENABLE_GOOGLE_SYNC", "0"),
        "category": "GOOGLE",
        "is_encrypted": False,
    },
]

github_config_variables = [
    {
        "key": "GITHUB_CLIENT_ID",
        "value": os.environ.get("GITHUB_CLIENT_ID"),
        "category": "GITHUB",
        "is_encrypted": False,
    },
    {
        "key": "GITHUB_CLIENT_SECRET",
        "value": os.environ.get("GITHUB_CLIENT_SECRET"),
        "category": "GITHUB",
        "is_encrypted": True,
    },
    {
        "key": "GITHUB_ORGANIZATION_ID",
        "value": os.environ.get("GITHUB_ORGANIZATION_ID"),
        "category": "GITHUB",
        "is_encrypted": False,
    },
    {
        "key": "ENABLE_GITHUB_SYNC",
        "value": os.environ.get("ENABLE_GITHUB_SYNC", "0"),
        "category": "GITHUB",
        "is_encrypted": False,
    },
]


gitlab_config_variables = [
    {
        "key": "GITLAB_HOST",
        "value": os.environ.get("GITLAB_HOST"),
        "category": "GITLAB",
        "is_encrypted": False,
    },
    {
        "key": "GITLAB_CLIENT_ID",
        "value": os.environ.get("GITLAB_CLIENT_ID"),
        "category": "GITLAB",
        "is_encrypted": False,
    },
    {
        "key": "GITLAB_CLIENT_SECRET",
        "value": os.environ.get("GITLAB_CLIENT_SECRET"),
        "category": "GITLAB",
        "is_encrypted": True,
    },
    {
        "key": "ENABLE_GITLAB_SYNC",
        "value": os.environ.get("ENABLE_GITLAB_SYNC", "0"),
        "category": "GITLAB",
        "is_encrypted": False,
    },
]

gitea_config_variables = [
    {
        "key": "IS_GITEA_ENABLED",
        "value": os.environ.get("IS_GITEA_ENABLED", "0"),
        "category": "GITEA",
        "is_encrypted": False,
    },
    {
        "key": "GITEA_HOST",
        "value": os.environ.get("GITEA_HOST"),
        "category": "GITEA",
        "is_encrypted": False,
    },
    {
        "key": "GITEA_CLIENT_ID",
        "value": os.environ.get("GITEA_CLIENT_ID"),
        "category": "GITEA",
        "is_encrypted": False,
    },
    {
        "key": "GITEA_CLIENT_SECRET",
        "value": os.environ.get("GITEA_CLIENT_SECRET"),
        "category": "GITEA",
        "is_encrypted": True,
    },
    {
        "key": "ENABLE_GITEA_SYNC",
        "value": os.environ.get("ENABLE_GITEA_SYNC", "0"),
        "category": "GITEA",
        "is_encrypted": False,
    },
]

smtp_config_variables = [
    {
        "key": "ENABLE_SMTP",
        "value": os.environ.get("ENABLE_SMTP", "0"),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_HOST",
        "value": os.environ.get("EMAIL_HOST", ""),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_HOST_USER",
        "value": os.environ.get("EMAIL_HOST_USER", ""),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_HOST_PASSWORD",
        "value": os.environ.get("EMAIL_HOST_PASSWORD", ""),
        "category": "SMTP",
        "is_encrypted": True,
    },
    {
        "key": "EMAIL_PORT",
        "value": os.environ.get("EMAIL_PORT", "587"),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_FROM",
        "value": os.environ.get("EMAIL_FROM", ""),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_USE_TLS",
        "value": os.environ.get("EMAIL_USE_TLS", "1"),
        "category": "SMTP",
        "is_encrypted": False,
    },
    {
        "key": "EMAIL_USE_SSL",
        "value": os.environ.get("EMAIL_USE_SSL", "0"),
        "category": "SMTP",
        "is_encrypted": False,
    },
]

llm_config_variables = [
    {
        "key": "LLM_API_KEY",
        "value": os.environ.get("LLM_API_KEY"),
        "category": "AI",
        "is_encrypted": True,
    },
    {
        "key": "LLM_PROVIDER",
        "value": os.environ.get("LLM_PROVIDER", "openai"),
        "category": "AI",
        "is_encrypted": False,
    },
    {
        "key": "LLM_MODEL",
        "value": os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        "category": "AI",
        "is_encrypted": False,
    },
    # Deprecated, use LLM_MODEL
    {
        "key": "GPT_ENGINE",
        "value": os.environ.get("GPT_ENGINE", "gpt-3.5-turbo"),
        "category": "AI",
        "is_encrypted": False,
    },
]

unsplash_config_variables = [
    {
        "key": "UNSPLASH_ACCESS_KEY",
        "value": os.environ.get("UNSPLASH_ACCESS_KEY", ""),
        "category": "UNSPLASH",
        "is_encrypted": True,
    },
]

chat_support_config_variables = [
    {
        "key": "IS_CHAT_SUPPORT_ENABLED",
        "value": os.environ.get("IS_CHAT_SUPPORT_ENABLED", "1"),
        "category": "CHAT_SUPPORT",
        "is_encrypted": False,
    },
    {
        "key": "CHAT_SUPPORT_APP_ID",
        "value": os.environ.get("CHAT_SUPPORT_APP_ID", ""),
        "category": "CHAT_SUPPORT",
        "is_encrypted": False,
    },
]

core_config_variables = [
    *authentication_config_variables,
    *workspace_management_config_variables,
    *google_config_variables,
    *github_config_variables,
    *gitlab_config_variables,
    *gitea_config_variables,
    *smtp_config_variables,
    *llm_config_variables,
    *unsplash_config_variables,
    *chat_support_config_variables,
]
