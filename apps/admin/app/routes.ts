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
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  layout("./(all)/(home)/layout.tsx", [
    index("./(all)/(home)/page.tsx"),
    route("ldap", "./(all)/(home)/ldap/page.tsx"),
  ]),
  layout("./(all)/(dashboard)/(with-sidebar)/layout.tsx", [
    route("general", "./(all)/(dashboard)/(with-sidebar)/general/page.tsx"),
    route("workspace", "./(all)/(dashboard)/(with-sidebar)/workspace/page.tsx"),
    route("workspace/create", "./(all)/(dashboard)/(with-sidebar)/workspace/create/page.tsx"),
    route("email", "./(all)/(dashboard)/(with-sidebar)/email/page.tsx"),
    route("authentication", "./(all)/(dashboard)/(with-sidebar)/authentication/page.tsx"),
    route("authentication/github", "./(all)/(dashboard)/(with-sidebar)/authentication/github/page.tsx"),
    route("authentication/gitlab", "./(all)/(dashboard)/(with-sidebar)/authentication/gitlab/page.tsx"),
    route("authentication/google", "./(all)/(dashboard)/(with-sidebar)/authentication/google/page.tsx"),
    route("authentication/gitea", "./(all)/(dashboard)/(with-sidebar)/authentication/gitea/page.tsx"),
    route("authentication/oidc", "./(all)/(dashboard)/(with-sidebar)/authentication/oidc/page.tsx"),
    route("authentication/saml", "./(all)/(dashboard)/(with-sidebar)/authentication/saml/page.tsx"),
    route("authentication/ldap", "./(all)/(dashboard)/(with-sidebar)/authentication/ldap/page.tsx"),
    route("ai", "./(all)/(dashboard)/(with-sidebar)/ai/page.tsx"),
    route("image", "./(all)/(dashboard)/(with-sidebar)/image/page.tsx"),
    route("billing", "./(all)/(dashboard)/(with-sidebar)/billing/page.tsx"),
    route("user-management", "./(all)/(dashboard)/(with-sidebar)/user-management/page.tsx"),
  ]),
  layout("./(all)/(dashboard)/(without-sidebar)/layout.tsx", [
    route("reset-password", "./(all)/(dashboard)/(without-sidebar)/reset-password/page.tsx"),
  ]),
  // Catch-all route for 404 handling - must be last
  route("*", "./components/404.tsx"),
] satisfies RouteConfig;
