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
 * Standalone routes — children of ./(all)/layout.tsx but outside workspace context.
 * Includes profile settings, mobile auth, OAuth, installations, and workspace selector.
 */
export const standaloneRoutes: RouteConfigEntry[] = [
  // Work Items - New
  route("work-items/new", "./(all)/work-items/new/page.tsx"),

  // Profile Settings
  layout("./(all)/settings/profile/layout.tsx", [
    route("settings/profile/:profileTabId", "./(all)/settings/profile/[profileTabId]/page.tsx"),
  ]),

  // OAuth Installations
  layout("./(all)/installations/[provider]/layout.tsx", [
    route("installations/:provider", "./(all)/installations/[provider]/page.tsx"),
  ]),

  // Workspace Selector
  layout("./workspace-selector/layout.tsx", [
    route("workspace-selector/:feature/:identifier", "./workspace-selector/[feature]/[identifier]/page.tsx"),
  ]),
];
