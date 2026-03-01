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

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Wiki routes — a direct child of [workspaceSlug] layout.
 */
export const wikiRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(wiki)/wiki/layout.tsx", [
    // Wiki Home
    route(":workspaceSlug/wiki", "./(all)/[workspaceSlug]/(wiki)/wiki/page.tsx"),

    // Public Pages
    layout("./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/public/layout.tsx", [
      route(":workspaceSlug/wiki/public", "./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/public/page.tsx"),
    ]),

    // Private Pages
    layout("./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/private/layout.tsx", [
      route(":workspaceSlug/wiki/private", "./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/private/page.tsx"),
    ]),

    // Archived Pages
    layout("./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/archived/layout.tsx", [
      route(":workspaceSlug/wiki/archived", "./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/archived/page.tsx"),
    ]),

    // Shared Pages
    layout("./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/shared/layout.tsx", [
      route(":workspaceSlug/wiki/shared", "./(all)/[workspaceSlug]/(wiki)/wiki/(pageType)/shared/page.tsx"),
    ]),

    // Page Detail
    layout("./(all)/[workspaceSlug]/(wiki)/wiki/[pageId]/layout.tsx", [
      route(":workspaceSlug/wiki/:pageId", "./(all)/[workspaceSlug]/(wiki)/wiki/[pageId]/page.tsx"),
    ]),
  ]),
];
