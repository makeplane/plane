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
  layout("./(all)/(dashboard)/layout.tsx", [
    route("general", "./(all)/(dashboard)/general/page.tsx"),
    route("workspace", "./(all)/(dashboard)/workspace/page.tsx"),
    route("workspace/create", "./(all)/(dashboard)/workspace/create/page.tsx"),
    route("email", "./(all)/(dashboard)/email/page.tsx"),
    route("authentication", "./(all)/(dashboard)/authentication/page.tsx"),
    route("authentication/github", "./(all)/(dashboard)/authentication/github/page.tsx"),
    route("authentication/gitlab", "./(all)/(dashboard)/authentication/gitlab/page.tsx"),
    route("authentication/google", "./(all)/(dashboard)/authentication/google/page.tsx"),
    route("authentication/gitea", "./(all)/(dashboard)/authentication/gitea/page.tsx"),
    route("authentication/oidc", "./(all)/(dashboard)/authentication/oidc/page.tsx"),
    route("authentication/saml", "./(all)/(dashboard)/authentication/saml/page.tsx"),
    route("authentication/ldap", "./(all)/(dashboard)/authentication/ldap/page.tsx"),
    route("ai", "./(all)/(dashboard)/ai/page.tsx"),
    route("image", "./(all)/(dashboard)/image/page.tsx"),
    route("billing", "./(all)/(dashboard)/billing/page.tsx"),
  ]),
  // Catch-all route for 404 handling - must be last
  route("*", "./components/404.tsx"),
] satisfies RouteConfig;
