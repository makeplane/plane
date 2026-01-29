/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  index("./page.tsx"),
  route(":workspaceSlug/:projectId", "./[workspaceSlug]/[projectId]/page.tsx"),
  layout("./issues/[anchor]/layout.tsx", [route("issues/:anchor", "./issues/[anchor]/page.tsx")]),
  // Catch-all route for 404 handling
  route("*", "./not-found.tsx"),
] satisfies RouteConfig;
