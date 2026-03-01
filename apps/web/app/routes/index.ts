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

import { layout } from "@react-router/dev/routes";
import type { RouteConfig, RouteConfigEntry } from "@react-router/dev/routes";
import { authRoutes } from "./auth";
import { piRoutes } from "./pi";
import { projectRoutes } from "./projects";
import { redirectRoutes } from "./redirects";
import { settingsRoutes } from "./settings";
import { standaloneRoutes } from "./standalone";
import { upgradeRoutes } from "./upgrade";
import { wikiRoutes } from "./wiki";

/**
 * Assembles domain-specific route arrays into the full route tree.
 *
 * Layout hierarchy:
 *   authRoutes (top-level)
 *   └─ (all) layout
 *       ├─ [workspaceSlug] layout
 *       │   ├─ (projects) layout  ← projectRoutes
 *       │   ├─ (settings) layout  ← settingsRoutes
 *       │   ├─ wiki               ← wikiRoutes
 *       │   └─ pi-chat            ← piRoutes
 *       └─ standalone             ← standaloneRoutes
 *   upgradeRoutes (top-level)
 *   redirectRoutes (top-level)
 */
export const routes: RouteConfigEntry[] = [
  ...authRoutes,

  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [...projectRoutes, ...settingsRoutes, ...wikiRoutes, ...piRoutes]),

    ...standaloneRoutes,
  ]),

  ...upgradeRoutes,
  ...redirectRoutes,
] satisfies RouteConfig;
