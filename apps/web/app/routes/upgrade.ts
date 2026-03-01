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
 * Upgrade routes — top-level upgrade flow for plan selection,
 * cloud workspace upgrades, and self-hosted upgrades.
 */
export const upgradeRoutes: RouteConfigEntry[] = [
  layout("./upgrade/layout.tsx", [
    route("upgrade", "./upgrade/page.tsx"),

    // Upgrade plan type selection
    route("upgrade/:planType", "./upgrade/[planType]/page.tsx"),

    // Cloud upgrade flow
    layout("./upgrade/[planType]/cloud/layout.tsx", [
      route("upgrade/:planType/cloud", "./upgrade/[planType]/cloud/page.tsx"),

      // Cloud workspace-specific upgrade
      route("upgrade/:planType/cloud/:selectedWorkspace", "./upgrade/[planType]/cloud/[selectedWorkspace]/page.tsx"),
    ]),

    // Self-hosted upgrade flow
    layout("./upgrade/[planType]/self-hosted/layout.tsx", [
      route("upgrade/:planType/self-hosted", "./upgrade/[planType]/self-hosted/page.tsx"),
    ]),
  ]),
];
