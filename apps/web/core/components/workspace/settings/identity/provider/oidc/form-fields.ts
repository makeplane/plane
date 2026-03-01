/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export const OIDC_FORM_FIELDS = [
  {
    name: "client_id" as const,
    label: "Client ID",
    placeholder: "abc123xyz789",
    description: "A unique ID for this Plane app that you register on your IdP",
    required: true,
  },
  {
    name: "client_secret" as const,
    label: "Client secret",
    placeholder: "s3cr3tK3y123!",
    description: "The secret key that authenticates this Plane app to your IdP",
    required: true,
    type: "password" as const,
  },
  {
    name: "authorize_url" as const,
    label: "Authorize URL",
    placeholder: "https://example.com/oauth/authorize",
    description: "The URL that brings up your IdP's authentication screen when your users click Continue with",
    required: true,
  },
  {
    name: "token_url" as const,
    label: "Token URL",
    placeholder: "https://example.com/oauth/token",
    description: "The URL that talks to the IdP and persists user authentication on Plane",
    required: true,
  },
  {
    name: "userinfo_url" as const,
    label: "Users' info URL",
    placeholder: "https://example.com/userinfo",
    description: "The URL that fetches your users' info from your IdP",
    required: true,
  },
  {
    name: "logout_url" as const,
    label: "Logout URL",
    placeholder: "https://example.com/logout",
    description: "Optional field that controls where your users go after they log out of Plane",
    required: false,
  },
];
