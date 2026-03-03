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

import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const authRoutes: RouteConfigEntry[] = [
  // Home - Sign In
  layout("./(home)/layout.tsx", [
    index("./(home)/page.tsx"),
    route("ldap", "./(home)/ldap/page.tsx"),
    route("sso", "./(home)/sso/page.tsx"),
  ]),

  // Sign Up
  layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]),

  // Account Routes - Password Management
  layout("./(all)/accounts/forgot-password/layout.tsx", [
    route("accounts/forgot-password", "./(all)/accounts/forgot-password/page.tsx"),
  ]),
  layout("./(all)/accounts/reset-password/layout.tsx", [
    route("accounts/reset-password", "./(all)/accounts/reset-password/page.tsx"),
  ]),
  layout("./(all)/accounts/set-password/layout.tsx", [
    route("accounts/set-password", "./(all)/accounts/set-password/page.tsx"),
  ]),

  // Create Workspace
  layout("./(all)/create-workspace/layout.tsx", [route("create-workspace", "./(all)/create-workspace/page.tsx")]),

  // Onboarding
  layout("./(all)/onboarding/layout.tsx", [route("onboarding", "./(all)/onboarding/page.tsx")]),

  // Invitations
  layout("./(all)/invitations/layout.tsx", [route("invitations", "./(all)/invitations/page.tsx")]),

  // Workspace Invitations
  layout("./(all)/workspace-invitations/layout.tsx", [
    route("workspace-invitations", "./(all)/workspace-invitations/page.tsx"),
  ]),

  // Mobile Auth
  route("m/auth", "./m/auth/page.tsx"),

  // Desktop Auth
  route("d/auth", "./d/auth/page.tsx"),

  // OAuth Consent Page
  layout("./oauth/layout.tsx", [route("oauth", "./oauth/page.tsx")]),
];
