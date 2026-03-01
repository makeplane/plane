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

export const extendedRedirectRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // WIKI REDIRECTS
  // ========================================================================

  // Pages to Wiki redirect: /:workspaceSlug/pages/:path*
  // → /:workspaceSlug/wiki/:path*
  route(":workspaceSlug/pages/*", "routes/redirects/extended/wiki.tsx"),

  // ========================================================================
  // PI-CHAT → AI-CHAT REDIRECTS
  // ========================================================================

  // Workspace-level: /:workspaceSlug/pi-chat → /:workspaceSlug/ai-chat
  route(":workspaceSlug/pi-chat", "routes/redirects/extended/pi-chat.tsx"),
  // Workspace-level (with sub-path): /:workspaceSlug/pi-chat/:path* → /:workspaceSlug/ai-chat/:path*
  route(":workspaceSlug/pi-chat/*", "routes/redirects/extended/pi-chat.tsx"),

  // Project-level: /:workspaceSlug/projects/pi-chat → /:workspaceSlug/projects/ai-chat
  route(":workspaceSlug/projects/pi-chat", "routes/redirects/extended/pi-chat-project.tsx"),
  // Project-level (with sub-path): /:workspaceSlug/projects/pi-chat/:path* → /:workspaceSlug/projects/ai-chat/:path*
  route(":workspaceSlug/projects/pi-chat/*", "routes/redirects/extended/pi-chat-project.tsx"),
];
