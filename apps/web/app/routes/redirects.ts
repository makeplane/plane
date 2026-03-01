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

import { route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Legacy URL redirects for backward compatibility.
 */
export const redirectRoutes: RouteConfigEntry[] = [
  // Project settings redirect: /:workspaceSlug/projects/:projectId/settings/:path*
  // → /:workspaceSlug/settings/projects/:projectId/:path*
  route(":workspaceSlug/projects/:projectId/settings/*", "routes/redirects/core/project-settings.tsx"),

  // Analytics redirect: /:workspaceSlug/analytics → /:workspaceSlug/analytics/overview
  route(":workspaceSlug/analytics", "routes/redirects/core/analytics.tsx"),

  // API tokens redirect: /:workspaceSlug/settings/api-tokens → /settings/profile/api-tokens
  route(":workspaceSlug/settings/api-tokens", "routes/redirects/core/api-tokens.tsx"),

  // Inbox redirect: /:workspaceSlug/projects/:projectId/inbox → intake
  route(":workspaceSlug/projects/:projectId/inbox", "routes/redirects/core/inbox.tsx"),

  // Sign-up redirects
  route("accounts/sign-up", "routes/redirects/core/accounts-signup.tsx"),

  // Sign-in redirects
  route("sign-in", "routes/redirects/core/sign-in.tsx"),
  route("signin", "routes/redirects/core/signin.tsx"),
  route("login", "routes/redirects/core/login.tsx"),

  // Register redirect
  route("register", "routes/redirects/core/register.tsx"),

  // Profile settings redirects
  route("profile/*", "routes/redirects/core/profile-settings.tsx"),

  // Account settings redirects
  route(":workspaceSlug/settings/account/*", "routes/redirects/core/workspace-account-settings.tsx"),

  // Pages to Wiki redirect: /:workspaceSlug/pages/:path* → /:workspaceSlug/wiki/:path*
  route(":workspaceSlug/pages/*", "routes/redirects/extended/wiki.tsx"),
];
