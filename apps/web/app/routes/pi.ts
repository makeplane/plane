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
 * Plane Intelligence (Pi) chat routes — a direct child of [workspaceSlug] layout.
 */
export const piRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(pi)/pi-chat/layout.tsx", [
    // Pi Chat Home
    route(":workspaceSlug/ai-chat", "./(all)/[workspaceSlug]/(pi)/pi-chat/page.tsx"),

    // Pi Chat New
    route(":workspaceSlug/ai-chat/new", "./(all)/[workspaceSlug]/(pi)/pi-chat/new/page.tsx"),

    // Pi Chat Detail
    route(":workspaceSlug/ai-chat/:chatId", "./(all)/[workspaceSlug]/(pi)/pi-chat/[chatId]/page.tsx"),
  ]),
];
